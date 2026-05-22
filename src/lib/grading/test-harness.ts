/**
 * Test harness Python code that wraps student code + tests and prints
 * a structured JSON result to stdout. The grading worker parses this
 * JSON to construct test results.
 *
 * Contract: the worker concatenates [studentCode, harness(tests)] and runs it.
 */

export function buildHarness(testsSource: string): string {
  return `
# --- Test harness (do not modify) ---
import json as _json, sys as _sys, traceback as _tb, time as _time
_results = []

def _record(name, fn):
    start = _time.time()
    try:
        fn()
        _results.append({"name": name, "passed": True, "elapsed_ms": int((_time.time()-start)*1000)})
    except AssertionError as e:
        _results.append({"name": name, "passed": False, "error": str(e), "elapsed_ms": int((_time.time()-start)*1000)})
    except Exception as e:
        _results.append({
            "name": name, "passed": False,
            "error": f"{type(e).__name__}: {e}",
            "elapsed_ms": int((_time.time()-start)*1000),
        })

# --- Tests injected below ---
${testsSource}

# Auto-discover test_ functions in current scope
for _n, _fn in list(globals().items()):
    if _n.startswith("test_") and callable(_fn):
        _record(_n, _fn)

print("__TEST_RESULTS__" + _json.dumps(_results) + "__END__")
`
}

const RESULT_MARKER_BEGIN = '__TEST_RESULTS__'
const RESULT_MARKER_END = '__END__'

export function parseHarnessOutput(stdout: string): {
  results: Array<{ name: string; passed: boolean; error?: string; elapsed_ms: number }>
  consoleOut: string
} {
  const start = stdout.lastIndexOf(RESULT_MARKER_BEGIN)
  if (start === -1) return { results: [], consoleOut: stdout }
  const end = stdout.indexOf(RESULT_MARKER_END, start)
  if (end === -1) return { results: [], consoleOut: stdout }
  const jsonStr = stdout.slice(start + RESULT_MARKER_BEGIN.length, end)
  const consoleOut = stdout.slice(0, start) + stdout.slice(end + RESULT_MARKER_END.length)
  try {
    return { results: JSON.parse(jsonStr), consoleOut }
  } catch {
    return { results: [], consoleOut }
  }
}
