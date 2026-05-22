# Deploy runbook

## One-time setup

### Supabase project
1. Create project at https://supabase.com (free tier)
2. Copy `Project URL` and `anon key` → into Vercel env as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Copy `service_role key` → Vercel env as `SUPABASE_SERVICE_ROLE_KEY` (server-only)
4. Generate grading key, save in both Supabase and Vercel

### Apply migrations
```bash
pnpm supabase link --project-ref <your-ref>
pnpm supabase db push
```

### Deploy Edge Functions
```bash
pnpm supabase functions deploy grade-submission
pnpm supabase functions deploy ai-feedback

# Set secrets
pnpm supabase secrets set \
  GROQ_API_KEY=... \
  GRADING_ENCRYPTION_KEY=... \
  PYTHON_WORKER_URL=https://your-fly-app.fly.dev/run \
  PYTHON_WORKER_TOKEN=...
```

### Python worker on Fly.io
1. `flyctl launch --image python:3.11-slim`
2. Use `supabase/functions/python-worker/README.md` for app.py reference
3. Set token env on Fly: `flyctl secrets set WORKER_TOKEN=...`

### Vercel
1. Import repo to Vercel
2. Build command: `pnpm build`
3. Set all env vars from `.env.example`
4. Deploy

## Routine ops

### Daily
- Check Supabase dashboard for DB usage (target <80%)
- Check Vercel function invocation count

### Weekly
- Review `submissions` rows stuck in `pending` (background job?)
- Review `ai_chat_messages` count vs cap

### Monthly
- Re-vacuum DB: `vacuum analyze;`
- Review plagiarism flags
- Review LLM cost

## Incident response

See `docs/runbook/incident.md`.
