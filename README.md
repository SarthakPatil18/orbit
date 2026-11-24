# ProofDesk

Evidence-conditioned AI support for **Orbit**, a fictional campus-event SaaS. ProofDesk answers only from approved Orbit sources, shows its evidence and decision trace, and routes sensitive work to humans through a structured handoff packet. Lifecycle email journeys run on a deterministic, policy-gated engine.

## Quick start (demo mode)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Demo mode is on by default and needs no API keys: answers are composed deterministically from approved sources, retrieval is lexical over the seeded knowledge base, and emails are captured in the in-app sink and labeled `previewed`.

This is a working fellowship prototype, not production software.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` / `npm run start` — production build and server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm test` — Vitest unit/integration tests
- `npm run test:e2e` — Playwright (browsers must be installed)
- `npm run db:migrate` — apply Drizzle migrations to PostgreSQL
- `npm run db:seed` / `npm run db:reset` — seed or reseed the configured store
- `npm run verify` — lint + typecheck + tests + build

## PostgreSQL mode

```bash
docker compose up -d
cp .env.example .env.local
# edit .env.local: DEMO_MODE=true, STORAGE_DRIVER=postgres, DATABASE_URL=postgresql://proofdesk:proofdesk@localhost:5432/proofdesk
npm run db:migrate
npm run db:seed
npm run dev
```

## Environment

See `.env.example`. Optional integrations: Anthropic (`ANTHROPIC_API_KEY`, ignored while `DEMO_MODE=true`), Voyage embeddings (`EMBEDDING_PROVIDER=voyage`), Resend (`RESEND_API_KEY` plus `DEMO_EMAIL_TO` allowlist), and `CRON_SECRET` for the inactivity cron.

## Surfaces

- `/` — Orbit landing page with the ProofDesk chat widget
- `/desk` — agent desk: triage, cited threads, handoff packets, trace inspector
- `/journeys` — lifecycle studio: four journeys, email previews, event simulator, in-app email sink
- `/trust` — evaluation Trust Center: 20-case golden suite, real metrics, release gates, integration reality
- `/knowledge` — knowledge library, editor, reindex, retrieval playground

## Required endpoints

`POST /api/answer`, `POST /api/events`, `POST /api/evaluations/run`, `GET /api/evaluations/runs/:id`, `GET /api/health`, plus CRUD/action routes for conversations, handoffs, journeys, deliveries, knowledge, and audit.

## Reviewer endpoint

Replace the host with the deployed URL before submission. This command was run against the local production server on 24 November 2026 and returned `decision: "answer"`, source key `kb-attendee-export`, `mode: "deterministic-demo"`, `escalate: false`, `estimatedCostUsd: 0`, and a `trace_` id.

```bash
curl -sS -X POST http://127.0.0.1:3000/api/answer \
  -H 'Content-Type: application/json' \
  -d '{"question":"How do I export only paid attendees?"}'
```

`GET /api/health` reports demo mode, the storage driver, and which integrations are off.

## Full disclosure

- **Model.** Demo mode does not call a model. Answers are composed by the deterministic policy from approved Orbit sources. The optional generator is `ANTHROPIC_MODEL`, default `claude-sonnet-5`, chosen because a short excerpt-grounded draft is useful while the policy engine still chooses answer, clarify, abstain, or escalate.
- **Fallback.** If the model is enabled and the key is missing, the provider errors, the call times out (12 seconds), or the circuit breaker is open, the turn is labeled “Model/provider unavailable” and the approved deterministic answer is used (`mode: deterministic-fallback`). Demo mode labels itself “Deterministic demo” and does not pretend the provider failed.
- **Email.** Demo deliveries are previewed in the in-app sink and labeled `previewed`. They are not sent. With Resend configured, mail goes only to `DEMO_EMAIL_TO`. Preview-sink cost is $0. No Resend price is invented.
- **Cost.** Deterministic answers are $0. No vendor price list was fetched on 24 November 2026. If `MODEL_INPUT_USD_PER_MILLION` and `MODEL_OUTPUT_USD_PER_MILLION` are unset, no model dollar amount is estimated. If an operator sets them, cost is `(input tokens × input rate + output tokens × output rate) / 1,000,000`.
- **What breaks first.** The file store is single-process. A second server does not share it. The in-memory rate limiter and model circuit breaker reset on restart.
- **Persistence.** Default storage is `.data/proofdesk.json`. Conversations, handoffs, journey runs, and deliveries survive refresh on that one instance. PostgreSQL is optional via `DATABASE_URL`.
- **Security.** There is no login. The agent desk is open. Mutations check same-origin only. Requests with no `Origin`, including curl, are allowed. Do not put real customer data here. Human desk hours shown in chat are weekdays 09:00–18:00 Asia/Kolkata.

## Docs

- `docs/FINAL_CHECKLIST.md` — Definition of done against this prototype
- `docs/DEMO_SCRIPT.md` — 3–6 minute reviewer script
- `docs/SUBMISSION_COPY.md` — paste-ready submission text
- `docs/FIX_REPORT.md` — what changed and what was verified
- `docs/ARCHITECTURE.md`
- `docs/DECISION_POLICY.md`
- `docs/VOICE_AND_TONE.md`
- `docs/TECHNICAL_REPORT.md`