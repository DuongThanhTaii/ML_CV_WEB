# ADR 003: AI generates feedback, not grades

**Status**: Accepted
**Date**: 2026-05-22

## Context

Original spec proposed "AI-assisted grading". This risks:
- Non-deterministic scores (different runs → different grades)
- Hallucinated metric values
- No audit trail for grade appeals

## Decision

- **Scores are 100% deterministic**, produced by `src/lib/grading/scorer.ts` from test results
- **AI only generates qualitative feedback** (prose, hints, explanation)
- Teachers can override any score manually

## Rationale

- Grades affect transcripts; must be defensible
- LLMs cannot reliably compare floating point metrics
- Deterministic scoring is also faster and cheaper

## Consequences

- AI tutor and feedback are decoupled from scoring path
- `grading_results.graded_by` column tracks `auto` | `ai_assisted` | `manual:<teacher_id>`
- Teachers see AI suggestions but final grade is theirs
