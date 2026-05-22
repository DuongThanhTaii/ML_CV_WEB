# Pyodide Execution Pipeline

## Goals
- Run Python in browser with the scientific stack (numpy/pandas/sklearn/skimage).
- Capture stdout, errors, matplotlib figures, DataFrame HTML.
- Enforce timeouts and isolation.
- Keep main thread responsive.

## Architecture

```
Main Thread (React)                Web Worker
─────────────────                  ──────────────
  CodeCell                          worker.ts
    ↓ runCell(code)                   ↓ self.onmessage
  PyodideRuntime.runCell ─────────►  pyodide.runPythonAsync(code)
    ↓ postMessage                     ↓ stdout/stderr stream
  handleMessage  ◄──────────────────  postMessage({type:'output'})
    ↓                                 ↓
  setOutputs(cell.id, …)             postMessage({type:'done', outputs})
```

## Key design decisions

### Singleton runtime
One `PyodideRuntime` instance per page. Shared by all cells, so variables persist (Jupyter semantics).

### Web Worker isolation
- Infinite loop in user code freezes the worker, not the UI.
- Timeout enforced by main thread: `setTimeout` → `worker.terminate()` after N ms.
- Fresh worker spawned on next run.

### Matplotlib hook
Patches `plt.show()` to render figure to base64 PNG and `postMessage` it back. Avoids opening browser-level windows.

### DataFrame rendering
On run completion, the worker inspects the result. If `isinstance(result, pd.DataFrame)`, calls `to_html()` and tags as `text/html`.

### Package loading
- `loadPackagesFromImports()` auto-resolves imports in user code.
- Common ones (numpy, pandas, matplotlib, scipy) pre-loaded during `init`.

## Limits

| Resource | Limit | Why |
|---|---|---|
| Wall time per cell | 30s default | Configurable per assignment |
| Memory | ~1.5GB before kill | Browser heap monitoring |
| Network | Blocked from worker | CSP + same-origin policy |
| FS | Pyodide virtual FS only | No real disk access |

## Supported packages (verified)

✅ numpy, pandas, matplotlib, scipy, scikit-learn, scikit-image, Pillow, seaborn, plotly, networkx, sympy

⚠️ Partial: opencv-python-headless (limited ops)

❌ pytorch, tensorflow, jax — use ONNX Runtime Web for inference instead

## Future optimizations

- Shared kernel across notebook tabs (BroadcastChannel)
- Service Worker cache of Pyodide assets
- Persistent virtual FS (IndexedDB) so `pd.read_csv` survives reload
- WebGPU acceleration (when stable in Pyodide)
