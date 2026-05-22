# ADR 002: Use Supabase only (no separate Neon.tech)

**Status**: Accepted
**Date**: 2026-05-22

## Context

Original spec mentioned both Supabase and Neon.tech as Postgres options.

## Decision

Use Supabase exclusively for Postgres, Auth, Storage, Realtime, and Edge Functions.

## Rationale

- Supabase already bundles Postgres → adding Neon duplicates the DB layer
- Two auth systems doubles complexity
- Single dashboard, single billing surface
- Supabase free tier (500MB DB, 1GB storage, 50k MAU) is sufficient for MVP

## Consequences

- Single source of truth for DB
- Vendor lock-in to Supabase — accepted trade-off because schema is portable Postgres

## Future migration triggers

Move to a dedicated Postgres (Neon, Railway, or self-hosted) when:
- DB > 400MB (approaching free tier cap)
- Need read replicas
- Need point-in-time recovery beyond Supabase's offering

Migration plan: standard `pg_dump | pg_restore`. RLS policies are SQL so they port.
