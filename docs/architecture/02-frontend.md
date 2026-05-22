# Frontend Architecture

## Stack
- Next.js 15 (App Router, RSC by default)
- TypeScript strict, `noUncheckedIndexedAccess`
- TailwindCSS + shadcn primitives
- React Query for server state, Zustand for local state
- React Hook Form + Zod at boundaries
- Monaco Editor for code, react-markdown for content

## Route map

| Route | Auth | Purpose |
|---|---|---|
| `/` | public | Landing |
| `/login`, `/callback` | public | Auth |
| `/dashboard` | student+ | Home, enrolled courses, quick links |
| `/courses` | student+ | Catalog |
| `/courses/[slug]` | student+ | Course detail |
| `/courses/[slug]/lessons/[id]` | student+ | Lesson + embedded notebook |
| `/playground` | student+ | Free notebook |
| `/notebook/[id]` | owner | Standalone notebook |
| `/datasets` | student+ | Dataset library |
| `/ai-tutor` | student+ | Persistent chat |
| `/teacher/*` | teacher | Teacher console |
| `/api/ai/*`, `/api/grading/*` | authenticated | Server routes |

## Component grouping

Components are grouped by domain, NOT by type:

```
components/
  ai/          chat, hints, feedback widgets
  auth/        login forms, OAuth buttons
  layout/      sidebar, topbar
  notebook/    cell, code-cell, markdown-cell, output-renderer
  grading/     test results, submit panel
  lesson/      MDX viewer, progress bar
  dataset/     uploader, preview, stats
  ui/          shadcn primitives (button, input, card)
```

## State strategy

| Type | Tool | Example |
|---|---|---|
| Server data | React Query | course list, submissions |
| Auth | `createServerSupabase()` | user, role |
| Notebook cells | Zustand | cells array, run state |
| Form | React Hook Form | login form, assignment editor |
| Realtime | Supabase Realtime | submission graded status |

## Data fetching rules

- **Server Components**: prefer for read-only initial render. Use `createServerSupabase()`.
- **Client Components**: only when interactivity needed (`'use client'` at top).
- **API routes**: only when secrets needed (LLM API keys, encryption keys).

## Performance

- Pyodide route segments include `dynamic = 'force-dynamic'` to avoid serializing worker state.
- Heavy imports (Monaco, Plotly) via `next/dynamic`.
- Images via `next/image`.
- Pre-warm Pyodide on `mouseenter` of "Open Notebook" buttons.
