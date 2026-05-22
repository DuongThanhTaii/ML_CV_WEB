# Coding Standards

## TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`
- Avoid `any`; use `unknown` + narrowing
- Zod schemas at all external boundaries (API, env, file uploads)
- Discriminated unions for state machines

## React
- Server Components by default; `'use client'` only when needed
- One component per file, kebab-case file names
- Co-locate hooks with components if used only there
- Prefer composition over prop drilling; Context for theme/auth only

## Styling
- Tailwind utility-first
- Extract component when 3+ utilities repeat across files
- shadcn primitives for buttons/inputs/dialogs — never raw HTML

## Naming
- Components: `PascalCase`
- Hooks: `useCamelCase`
- Files: `kebab-case.tsx` (everywhere)
- DB columns: `snake_case`

## Imports order
1. React/Next
2. External libs
3. `@/*` internal absolute
4. Relative `./`
5. Types
6. Styles

## Comments
- Default: no comments. Code should be self-evident
- Comment only WHY for non-obvious decisions
- No TODO without an owner

## Tests
- Vitest for unit + component
- Playwright for E2E (golden paths)
- 70% line coverage target
- 100% on `src/lib/grading/scorer.ts` and `src/lib/grading/encryption.ts`

## Commits (Conventional Commits)

```
feat(notebook): add cell collapse
fix(grading): handle timeout in pyodide worker
chore(deps): bump next to 15.2
docs(adr): record decision to drop neon.tech
refactor(ai): extract gateway provider interface
test(e2e): cover submission flow
```

## Branches

```
main          → production (auto-deploy)
develop       → next release
feat/<name>   → feature branch
fix/<name>    → bug fix
hotfix/<name> → urgent prod fix
```

## PR rules
- Squash merge to develop
- Develop → main only via release branches
- CI must pass: lint + typecheck + unit + E2E

## Database
- Migration file naming: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Enable RLS BEFORE creating policies
- Every FK has an index
- Use `gen_random_uuid()` for IDs
- Timestamps: `timestamptz`, never `timestamp`
