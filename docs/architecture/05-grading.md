# Grading Engine

## Two tiers

**Tier 1 (client, optional)** — visible tests in browser. Instant feedback, not authoritative.

**Tier 2 (server)** — hidden tests. Authoritative score.

## Flow

```
[Student] Submit
    ↓
[Client] Run visible tests in Pyodide
    ↓ POST /api/grading/submit
[Next.js Route] insert submission(pending) → call Edge Function
    ↓
[Edge Function] decrypt hidden tests → POST python worker
    ↓
[Python Worker] run code+tests, capture results
    ↓
[Edge Function] compute score → insert grading_results
    ↓ realtime
[Client] receive 'graded' event → show score
    ↓ async
[Edge Function] trigger ai-feedback function → LLM writes prose
```

## Encryption

- AES-256-GCM, 32-byte key (`GRADING_ENCRYPTION_KEY` env)
- Format: `base64(iv[12] || ciphertext)`
- Key lives only in Edge Function env, never in browser bundle
- Encrypt offline via `pnpm encrypt:tests path/to/hidden.py`

## Test harness

Wraps student code + tests. Auto-discovers `test_*` functions. Outputs marker-delimited JSON:

```
__TEST_RESULTS__[{...},{...}]__END__
```

See `src/lib/grading/test-harness.ts`.

## Scoring

Pure functions in `src/lib/grading/scorer.ts`:

- `scoreUnittest(tests)` — `passed/total * maxScore`
- `scoreMetric(value, config)` — linear interpolation between zero and full marks
- `scoreMixed(...)` — weighted combination

All deterministic. 100% test coverage required.

## Anti-cheating

| Strategy | Layer | When |
|---|---|---|
| `code_hash` dedup | DB index | Indexed by `sha256(code)` |
| AST similarity | Background job | Nightly across new submissions |
| Embedding similarity | Background job | Weekly |
| Rate limit | Edge Function | Max 1 submission / 30s / student |
| Network freeze | Worker | Block urllib, requests, socket |
| Attempt cap | DB constraint | `max_attempts` per assignment |
| Code watermark | Starter code | Unique comment injected per student |

## Limitations & alternatives

| Approach | Pros | Cons |
|---|---|---|
| Pyodide on Deno | Single language | Slow cold start |
| Fly.io persistent worker | Fast, full Python | Free tier 3 VM cap |
| Modal.com | Free credits, GPU | Quota-based |
| GitHub Actions | Free | Slow (~2 min per run) |

**Recommended for MVP**: Fly.io free Python worker. See `supabase/functions/python-worker/README.md`.
