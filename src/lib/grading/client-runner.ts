'use client'

/**
 * Tier-1 grading: runs VISIBLE tests in the browser via Pyodide.
 * This gives the student instant feedback before they submit.
 * Final score is determined by the server-side hidden tests (Tier 2).
 */

import { PyodideRuntime } from '@/lib/pyodide/runtime'
import { buildHarness, parseHarnessOutput } from './test-harness'
import type { TestResult } from './types'

export async function runVisibleTests(
  studentCode: string,
  visibleTests: string,
): Promise<{ tests: TestResult[]; stdout: string }> {
  const runtime = PyodideRuntime.get()
  const script = `${studentCode}\n\n${buildHarness(visibleTests)}`
  const result = await runtime.runCell(script, { timeoutMs: 30_000 })

  const stdoutStr = result.outputs
    .filter((o) => o.type === 'stdout')
    .map((o) => o.data)
    .join('')

  const { results, consoleOut } = parseHarnessOutput(stdoutStr)

  return {
    tests: results.map((r) => ({
      name: r.name,
      passed: r.passed,
      error: r.error,
    })),
    stdout: consoleOut,
  }
}
