# Technical Report

## Implementation summary

ProofDesk implements the evidence-conditioned support loop end to end: retrieval, policy-gated autonomy, deterministic/model generation with claim verification, citations, handoffs, lifecycle email journeys, knowledge management, evaluation, and an audit trail.

## Architecture and tradeoffs

- Storage: a durable atomic JSON adapter is the default so the demo runs without Docker; a full Drizzle/PostgreSQL adapter and migrations are included for deployment. Tradeoff: file mode is single-instance.
- Retrieval: deterministic lexical scoring with synonym normalization, authority/freshness/margin/contradiction checks. Optional pgvector/Voyage is documented but not required; PostgreSQL FTS is the baseline.
- Generation: Anthropic is optional and skipped in demo mode even if a key exists, so reviews are reproducible. A circuit breaker and citation verification prevent ungrounded answers.
- Email: React Email templates with merge-field safety; demo sink marks `sent` with provider `demo-sink`; Resend is gated by an allowlist.
- Policy: a pure function over evidence and signals; thresholds live in `src/lib/evaluation-gates.ts` and are shared by the server runner and Trust Center client.

## Test and build results

- `npm run lint`: pass (0 errors)
- `npm run typecheck`: pass
- `npm test`: 8 files, 15 tests, all pass
- `npm run build`: pass

## Integration reality

- Answer generation: deterministic in demo mode; real when `DEMO_MODE=false` and `ANTHROPIC_API_KEY` set.
- Retrieval: real lexical/FTS; vector search unavailable without Voyage.
- Persistence: file adapter in demo; PostgreSQL when configured and migrated.
- Email: previewed in demo sink; real Resend only for the allowlisted recipient.
- Rate limiting: real, in-memory, single-instance.
- Cron: previewed without `CRON_SECRET`; configured with it.