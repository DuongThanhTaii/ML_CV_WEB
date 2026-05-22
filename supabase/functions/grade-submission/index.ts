// deno-lint-ignore-file no-explicit-any
/**
 * Edge Function: grade-submission
 *
 * Server-side grading. Hidden tests stay on server, decrypt → run via Pyodide
 * (loaded over the wire) → score → persist.
 *
 * Strategy:
 * - Pyodide-on-Deno can be heavy (cold start). For MVP this function:
 *   1. Decrypts hidden tests
 *   2. Calls a worker URL (configurable) that hosts a persistent Python runtime
 *   3. Falls back to AST-only validation if no worker is configured
 *
 * Variables in env:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - GRADING_ENCRYPTION_KEY
 *   - PYTHON_WORKER_URL (optional, e.g. https://your-fly-app.fly.dev/run)
 *   - PYTHON_WORKER_TOKEN (optional)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { decryptTests } from '../_shared/encryption.ts'

interface Body {
  submissionId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { submissionId } = (await req.json()) as Body
    if (!submissionId) return json({ error: 'submissionId required' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Fetch submission + assignment
    const { data: sub, error } = await supabase
      .from('submissions')
      .select('id, code, assignment_id, student_id, attempt_number, assignments(*)')
      .eq('id', submissionId)
      .single()
    if (error || !sub) return json({ error: 'submission not found' }, 404)

    const a: any = sub.assignments
    if (sub.attempt_number > a.max_attempts) {
      await supabase.from('submissions').update({ status: 'error' }).eq('id', submissionId)
      return json({ error: 'max attempts exceeded' }, 429)
    }

    // 2. Mark as running
    await supabase.from('submissions').update({ status: 'running' }).eq('id', submissionId)

    // 3. Decrypt hidden tests
    let hiddenTests = ''
    if (a.hidden_tests_encrypted) {
      hiddenTests = await decryptTests(
        a.hidden_tests_encrypted,
        Deno.env.get('GRADING_ENCRYPTION_KEY')!,
      )
    }

    // 4. Run via worker (preferred) or skip
    const workerUrl = Deno.env.get('PYTHON_WORKER_URL')
    let runResult: { results: Array<{ name: string; passed: boolean; error?: string }>; stdout: string; stderr: string; metricValue?: number }
    let executionTimeMs = 0

    if (workerUrl) {
      const start = Date.now()
      const wRes = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('PYTHON_WORKER_TOKEN') ?? ''}`,
        },
        body: JSON.stringify({
          code: sub.code,
          tests: hiddenTests,
          timeoutSeconds: a.time_limit_seconds ?? 30,
          metricConfig: a.metric_config,
        }),
      })
      executionTimeMs = Date.now() - start
      if (!wRes.ok) {
        await supabase.from('submissions').update({ status: 'error' }).eq('id', submissionId)
        return json({ error: `worker error: ${wRes.status}` }, 502)
      }
      runResult = await wRes.json()
    } else {
      // No worker configured: mark for manual review
      await supabase.from('submissions').update({ status: 'manual_review' }).eq('id', submissionId)
      return json({ status: 'manual_review', note: 'No PYTHON_WORKER_URL set' })
    }

    // 5. Score
    const total = runResult.results.length
    const passed = runResult.results.filter((r) => r.passed).length
    const baseScore = total > 0 ? (passed / total) * a.max_score : 0
    const metricScore = runResult.metricValue !== undefined && a.metric_config
      ? scoreMetric(runResult.metricValue, a.metric_config, a.max_score)
      : null

    const finalScore = metricScore !== null
      ? a.evaluation_type === 'mixed'
        ? baseScore * 0.4 + metricScore * 0.6
        : metricScore
      : baseScore

    // 6. Persist grading result
    await supabase.from('grading_results').insert({
      submission_id: submissionId,
      score: round(finalScore),
      max_score: a.max_score,
      passed_tests: passed,
      total_tests: total,
      test_details: runResult.results,
      metric_value: runResult.metricValue ?? null,
      execution_time_ms: executionTimeMs,
      stdout: runResult.stdout?.slice(0, 10_000),
      stderr: runResult.stderr?.slice(0, 5000),
      graded_by: 'auto',
    })

    await supabase.from('submissions').update({ status: 'graded' }).eq('id', submissionId)

    // 7. Fire-and-forget: AI feedback (separate function call to avoid blocking)
    EdgeRuntime.waitUntil(triggerAIFeedback(supabase, submissionId))

    return json({ ok: true, score: finalScore, passed, total })
  } catch (err) {
    console.error('grade-submission error', err)
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function round(n: number, decimals = 2) {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

function scoreMetric(value: number, config: any, maxScore: number): number {
  const { scoring } = config
  const { fullMarksAt, zeroMarksAt } = scoring
  const higherBetter = fullMarksAt > zeroMarksAt
  if (higherBetter) {
    if (value >= fullMarksAt) return maxScore
    if (value <= zeroMarksAt) return 0
    return ((value - zeroMarksAt) / (fullMarksAt - zeroMarksAt)) * maxScore
  }
  if (value <= fullMarksAt) return maxScore
  if (value >= zeroMarksAt) return 0
  return ((zeroMarksAt - value) / (zeroMarksAt - fullMarksAt)) * maxScore
}

async function triggerAIFeedback(supabase: any, submissionId: string) {
  try {
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-feedback`
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ submissionId }),
    })
  } catch (e) {
    console.warn('ai-feedback trigger failed', e)
  }
}

declare const EdgeRuntime: { waitUntil: (p: Promise<any>) => void }
