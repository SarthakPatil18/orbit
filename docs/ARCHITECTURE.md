# Architecture

## Overview

ProofDesk is a Next.js 16 App Router application. All persistence goes through a `Store` interface with two adapters: a durable atomic JSON file adapter (default in demo mode) and a PostgreSQL adapter via Drizzle. Multi-tenant scoping is by `organizationId` on every repository method.

## Request flow (chat)

1. `POST /api/answer` validates input, applies per-IP/per-session rate limiting, and asserts same origin.
2. `answerQuestion` loads conversation/customer context, expands the retrieval query for memory turns, and calls `retrieveEvidence`.
3. Retrieval scores knowledge chunks with lexical + IDF weighting, authority/freshness/margin/contradiction checks. PostgreSQL mode adds full-text search; file mode stays deterministic.
4. `decideAutonomy` (the policy engine) selects `answer | clarify | abstain | escalate` from evidence and signals. The model is never consulted for the decision.
5. In demo mode or on model failure, a deterministic answer is composed from the top source's `approvedAnswer`; otherwise Anthropic is called with claim verification and a circuit breaker.
6. On escalation, a handoff packet is built and persisted with status `pending_confirmation`. The widget can confirm it from the UI.
7. Messages, citations, trace, and audit log entries are persisted.

## Storage

- `src/lib/store/types.ts` — `Store` contract.
- `src/lib/store/file-store.ts` — atomic JSON writes, seed on first init, version-mismatch backup.
- `src/lib/store/postgres-store.ts` — Drizzle/PostgreSQL implementation.
- `src/lib/store/index.ts` — factory with fallback and test override.

## Knowledge and retrieval

- 14 seeded sources, including a stale SMS pilot and a superseded refund policy that create a conflict group.
- Chunking by heading in `src/lib/services/chunking.ts`.
- Retrieval thresholds: `RETRIEVAL_THRESHOLD = 0.35`, margin, stale, contradiction.

## Policy

- `src/lib/services/policy.ts` exports `decideAutonomy` and `POLICY_VERSION`.
- Rules are data (signals, rules, missing fields) returned in the trace.
- Sensitive actions (refunds, deletions, identity/payment changes) escalate and are never executed.

## Lifecycle

- `src/lib/services/lifecycle.ts` processes events, applies conditions, dedupe/entry limits, suppression, exits, and email rendering.
- Four journeys: Welcome, Inactivity nudge, Feature update (`offline-checkin-v1`), Offboarding.
- Emails render through React Email with merge-field safety; delivery uses the in-app sink in demo mode or Resend with an allowlist otherwise.

## Evaluation

- 20-case golden set in `src/lib/seed/cases.ts`.
- `runEvaluationSuite` runs every case through the real answer pipeline and computes metrics and release gates.
- Results and traces persist to `eval_runs` / `eval_results`.

## Frontend

- Design tokens in `src/app/globals.css`; shared UI in `src/components/ui.tsx`.
- Chat widget, agent desk, lifecycle studio, Trust Center, knowledge workspace.