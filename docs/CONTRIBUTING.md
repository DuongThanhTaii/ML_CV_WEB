# Contributing

## Setup

```bash
# 1. Install Node 20+ and pnpm
npm install -g pnpm

# 2. Install deps
pnpm install

# 3. Copy env
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, GROQ_API_KEY, GRADING_ENCRYPTION_KEY

# 4. Start Supabase locally (Docker required)
pnpm supabase start

# 5. Generate DB types from local Supabase
pnpm db:types

# 6. Run dev
pnpm dev
```

Open http://localhost:3000

## Generating the encryption key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Save to both `.env.local` and Supabase project env.

## Workflow

1. Create branch from `develop`: `feat/<name>`
2. Code + add tests
3. `pnpm typecheck && pnpm lint && pnpm test`
4. Open PR against `develop`
5. Squash merge after CI green + review

## Common scripts

```
pnpm dev              # Next dev server (Turbopack)
pnpm build            # Production build
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest
pnpm test:e2e         # Playwright
pnpm db:reset         # Reset local Supabase DB
pnpm db:types         # Regenerate src/types/database.ts
pnpm encrypt:tests f  # Encrypt a hidden tests file
```

## Encrypting hidden tests

Teachers should never paste plain Python into the `assignments.hidden_tests_encrypted` field. Always:

```bash
pnpm encrypt:tests path/to/hidden_tests.py
# Copy the printed base64 string into the DB row
```

## Submitting an issue

Use the issue templates in `.github/ISSUE_TEMPLATE/`. Include:
- What you expected
- What happened
- Steps to reproduce
- Browser + OS

## Architecture changes

For any change affecting:
- Public API shape
- DB schema
- Security boundaries
- External provider integration

…add an ADR in `docs/adr/NNN-short-title.md` BEFORE writing code.
