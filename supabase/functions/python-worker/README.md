# Python Worker (external service)

Edge Functions on Supabase have cold-start issues for Pyodide-on-Deno. For
production grading we recommend running a persistent Python service.

## Recommended deployment: Fly.io free tier (3 micro-VMs)

```
flyctl launch --image python:3.11-slim
```

Worker contract (HTTP POST):

**Request**
```json
{
  "code": "student python code",
  "tests": "hidden test python code",
  "timeoutSeconds": 30,
  "metricConfig": { "metric": "accuracy", "scoring": {...} }
}
```

**Response**
```json
{
  "results": [{"name": "test_x", "passed": true}],
  "stdout": "captured",
  "stderr": "captured",
  "metricValue": 0.87
}
```

## Minimal Python implementation (Fly.io)

```python
# app.py
from fastapi import FastAPI
from pydantic import BaseModel
import subprocess, json, tempfile, os, signal

app = FastAPI()

class GradeReq(BaseModel):
    code: str
    tests: str
    timeoutSeconds: int = 30

@app.post("/run")
def run(req: GradeReq):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        # write harness + code + tests
        f.write(req.code + "\n\n" + req.tests + "\n")
        # ... append harness logic similar to src/lib/grading/test-harness.ts
        path = f.name
    try:
        out = subprocess.run(
            ["python", path],
            capture_output=True, text=True, timeout=req.timeoutSeconds
        )
        # parse __TEST_RESULTS__ marker from out.stdout
        return parse_output(out.stdout, out.stderr)
    finally:
        os.unlink(path)
```

Auth via Bearer token in Authorization header. See env vars in
`supabase/functions/grade-submission/index.ts`.

## Alternative deployment options

1. **Modal.com** — serverless Python with free credits
2. **Railway** — 500h/month free
3. **GitHub Actions workflow_dispatch** — slow but free; queue submissions via `repository_dispatch` event
