# Architecture Overview

## High-level

```
Browser (Next.js + Pyodide + Monaco + AI Chat UI)
        │
        ├─── Supabase Postgres + Auth + Storage + Realtime
        │
        ├─── Supabase Edge Functions
        │      ├─ grade-submission  (server-side hidden tests)
        │      └─ ai-feedback       (post-grading LLM feedback)
        │
        ├─── External Python Worker (Fly.io / Modal)
        │      └─ Persistent Python runtime for grading
        │
        ├─── Groq API (chat tutor, streaming)
        └─── Gemini API (long-context code review)
```

## Three execution tiers

| Tier | Where | Used for |
|---|---|---|
| 1 | Pyodide in browser (Web Worker) | Notebook cells, visible tests, playground |
| 2 | Edge Function + Python Worker | Hidden test grading |
| 3 | LLM APIs | Tutoring, feedback generation |

## Why this split

- **Zero compute cost** at idle: 90%+ of work happens in the user's browser.
- **Privacy**: student code only leaves browser on explicit submit.
- **Security**: hidden tests stay encrypted at rest, decrypt only in Edge Function context.
- **Scalability**: each user brings their own CPU; no server contention.

## Trade-offs accepted

- Pyodide bundle ~10MB (cached after first load)
- No GPU training in browser (use external Colab link-out for advanced cases)
- Cold start on Vercel free tier (~1-2s on rare unhit routes)
- Supabase free tier pauses after 7 days inactivity (mitigated by cron ping)

## Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Pyodide first-load slow | Medium | Service Worker cache, lazy load, CDN |
| Hidden test leak via DevTools | High | Encryption + server-only execution |
| LLM quota exhaustion | Medium | Per-user rate limit + semantic cache |
| Free DB capacity reached | Medium | Periodic vacuum + archival migration path |
| Pyodide-on-Deno cold start | High | External Python worker via Fly.io |
| Infinite loop in user code | High | Web Worker timeout + terminate |
| Plagiarism | Medium | AST + embedding similarity, code hash |
| Browser memory cap | Low | Monitor heap, reset worker if > 1.5GB |

## Key directories

- `src/app` — Next.js routes (App Router)
- `src/components` — React components grouped by domain
- `src/lib` — Domain logic (pyodide, grading, ai, supabase)
- `src/hooks`, `src/stores` — React glue
- `supabase/` — DB schema, RLS, Edge Functions
- `docs/` — PRD, architecture, ADRs

## Related documents

- [PRD](../PRD.md)
- [Frontend architecture](02-frontend.md)
- [Database architecture](03-database.md)
- [Pyodide pipeline](04-pyodide.md)
- [Grading engine](05-grading.md)
- [AI subsystem](06-ai.md)
