// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { submissionId } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: sub } = await supabase
      .from('submissions')
      .select('code, assignment_id, assignments(title, description_mdx), grading_results(*)')
      .eq('id', submissionId)
      .single()
    if (!sub) return json({ error: 'not found' }, 404)

    const grading: any = (sub as any).grading_results?.[0]
    if (!grading) return json({ error: 'no grading yet' }, 409)

    const prompt = buildPrompt({
      assignmentTitle: (sub as any).assignments.title,
      score: grading.score,
      maxScore: grading.max_score,
      passed: grading.passed_tests,
      total: grading.total_tests,
      testDetails: grading.test_details,
      code: sub.code,
    })

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You give constructive feedback in Vietnamese.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    })

    if (!groqRes.ok) return json({ error: 'groq failed' }, 502)
    const data = await groqRes.json()
    const feedbackText = data.choices[0].message.content

    await supabase.from('ai_feedback').insert({
      submission_id: submissionId,
      feedback_type: 'explanation',
      model_used: 'groq:llama-3.3-70b-versatile',
      prompt_hash: await sha256(prompt),
      response_text: feedbackText,
      tokens_used: data.usage?.total_tokens ?? 0,
    })

    return json({ ok: true })
  } catch (err) {
    console.error('ai-feedback error', err)
    return json({ error: String(err) }, 500)
  }
})

function buildPrompt(args: {
  assignmentTitle: string
  score: number
  maxScore: number
  passed: number
  total: number
  testDetails: any[]
  code: string
}) {
  const failed = (args.testDetails ?? []).filter((t) => !t.passed)
  return `Sinh viên vừa nộp bài tập "${args.assignmentTitle}".

Điểm: ${args.score}/${args.maxScore}
Test pass: ${args.passed}/${args.total}

Test thất bại:
${failed.map((t, i) => `${i + 1}. ${t.name}: ${t.error ?? ''}`).join('\n') || '(không có)'}

Code:
\`\`\`python
${args.code.slice(0, 2500)}
\`\`\`

Hãy đưa ra nhận xét xây dựng (max 180 từ) bằng tiếng Việt theo format:

**👍 Điểm tốt**: ...
**🔍 Vấn đề chính**: ...
**🎯 Bước tiếp theo**: ...

Tuyệt đối KHÔNG viết lại lời giải đầy đủ. KHÔNG tiết lộ chi tiết hidden tests.`
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
