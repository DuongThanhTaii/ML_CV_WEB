# ADR 001: Use Pyodide for browser-side Python execution

**Status**: Accepted
**Date**: 2026-05-22
**Deciders**: Tài

## Context

We need to run Python (numpy, pandas, sklearn) for student notebooks. Options:

1. **Backend container** (Docker + flask/fastapi)
2. **Serverless container** (Modal, Fly Machines)
3. **JupyterHub**
4. **Pyodide in browser**

## Decision

Use Pyodide in the browser as the **primary** execution path. Use a server-side
Python worker only for Tier-2 grading (hidden tests).

## Rationale

- **Cost**: Each student brings own CPU → marginal compute cost is $0
- **Setup**: Zero friction; works on any modern browser
- **Privacy**: Student code never leaves the browser unless they submit
- **Latency**: <100ms per cell after warm-up vs ~1s round trip to server
- **Sufficient for educational use**: 90% of ML 101 use cases run fine in WASM

## Consequences

### Positive
- Truly $0/month compute up to 10k users
- Snappy UX
- Works offline (with cached Pyodide bundle)

### Negative
- ~10MB initial Pyodide download
- No GPU, no PyTorch/TF training
- Some packages unavailable (opencv) → use scikit-image substitute
- Memory limit ~1.5GB per tab
- Browser inconsistencies (mainly Safari)

### Mitigations
- Service Worker cache for Pyodide assets
- Document package compatibility matrix in `04-pyodide.md`
- For advanced training, link-out to Google Colab
- ONNX Runtime Web for CV inference demos

## Alternatives rejected

- **Backend container**: Doesn't fit $0 budget at any scale beyond a few users
- **Modal/Fly only**: Too slow for interactive notebook UX
- **JupyterHub**: Massive ops overhead for solo dev
