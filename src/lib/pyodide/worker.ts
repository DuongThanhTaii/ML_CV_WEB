/// <reference lib="webworker" />
/* eslint-disable @typescript-eslint/no-explicit-any */

declare const self: DedicatedWorkerGlobalScope
declare function loadPyodide(opts: unknown): Promise<any>

const PYODIDE_VERSION = '0.26.4'
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

self.importScripts(`${PYODIDE_INDEX_URL}pyodide.js`)

let pyodide: any = null
let currentId: string | null = null

function post(type: string, payload: unknown) {
  self.postMessage({ id: currentId, type, payload })
}

async function initPyodide() {
  pyodide = await loadPyodide({
    indexURL: PYODIDE_INDEX_URL,
    stdout: (text: string) => post('stdout', { text }),
    stderr: (text: string) => post('stderr', { text }),
  })

  await pyodide.loadPackage(['numpy', 'pandas', 'matplotlib'])

  await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use("AGG")
import matplotlib.pyplot as _plt
import io as _io
import base64 as _b64

def _ml_capture_plots():
    figs = []
    for num in _plt.get_fignums():
        fig = _plt.figure(num)
        buf = _io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight", dpi=100)
        buf.seek(0)
        figs.append(_b64.b64encode(buf.read()).decode())
    _plt.close("all")
    return figs

_plt.show = lambda *a, **kw: None
`)
}

async function runCell(id: string, code: string) {
  currentId = id
  const start = performance.now()
  const outputs: Array<{ type: string; data: string; mime?: string }> = []

  try {
    try {
      await pyodide.loadPackagesFromImports(code)
    } catch {
      // ignore — some imports may be stdlib or unavailable
    }

    const result = await pyodide.runPythonAsync(code)

    // Capture matplotlib figures opened during this cell
    try {
      const plotsProxy = pyodide.runPython('_ml_capture_plots()')
      const plots: string[] = plotsProxy?.toJs ? plotsProxy.toJs() : []
      if (plotsProxy?.destroy) plotsProxy.destroy()
      for (const data of plots) outputs.push({ type: 'image', data, mime: 'image/png' })
    } catch {
      // ignore if matplotlib not used
    }

    // Render the result of the last expression (if any)
    if (result !== undefined && result !== null) {
      pyodide.globals.set('_ml_result_', result)
      const kind: string = pyodide.runPython(`
import pandas as _pd
_KIND = "df" if isinstance(_ml_result_, _pd.DataFrame) else "repr"
_KIND
`)
      if (kind === 'df') {
        const html: string = pyodide.runPython(
          "_ml_result_.to_html(classes='df', max_rows=20)",
        )
        outputs.push({ type: 'result', data: html, mime: 'text/html' })
      } else {
        const text: string = pyodide.runPython('repr(_ml_result_)')
        outputs.push({ type: 'result', data: text, mime: 'text/plain' })
      }
      pyodide.runPython('del _ml_result_')
      if (result?.destroy) result.destroy()
    }

    post('done', { outputs, executionTimeMs: performance.now() - start })
  } catch (err: any) {
    post('error', {
      name: err?.name ?? 'PythonError',
      message: err?.message ?? String(err),
      traceback: err?.stack ?? '',
      executionTimeMs: performance.now() - start,
    })
  } finally {
    currentId = null
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data

  if (type === 'init') {
    currentId = id
    try {
      await initPyodide()
      post('ready', {})
    } catch (err: any) {
      post('error', { message: err?.message ?? String(err) })
    }
    return
  }

  if (type === 'run') {
    await runCell(id, payload.code)
    return
  }

  if (type === 'install') {
    currentId = id
    try {
      await pyodide.loadPackage(payload.packages)
      post('done', {})
    } catch (err: any) {
      post('error', { message: err?.message ?? String(err) })
    }
    return
  }
}

export {}
