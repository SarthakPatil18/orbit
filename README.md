# ProofDesk

ProofDesk is evidence-conditioned support for **Orbit**, a fictional campus-event product. It answers only from approved Orbit sources, shows the evidence and the decision, and hands the same transcript to a person when payment, security, privacy, or uncertainty requires it.

The useful difference is the boundary: the policy chooses answer, clarify, abstain, or escalate before any optional model writes, and a missing source becomes an explicit unknown instead of a guess.

This is a working fellowship prototype, not production software.

## Features

- Grounded chat on the Orbit landing page, with citations, decision labels, and conversation memory
- Agent desk with the handoff packet: goal, summary, transcript, reason, risk, sources, actions, missing information, and next step
- Four lifecycle journeys — welcome, inactivity, feature update, and offboarding — rendered as final email copy
- Knowledge library, retrieval playground, and audit
- Trust Center that runs the real 20-case golden suite

## Routes

| Route | What it is |
| --- | --- |
| `/` | Orbit landing page and ProofDesk chat |
| `/desk` | Agent desk. Open a thread with `/desk?conversation=<id>` |
| `/journeys` | Lifecycle studio and in-app email sink |
| `/knowledge` | Sources, retrieval playground, audit |
| `/trust` | Evaluation suite, release gates, and disclosure |
| `POST /api/answer` | Ask a question and get the public answer contract |
| `GET /api/health` | Demo mode, storage driver, and which integrations are off |
| `POST /api/events` | Lifecycle events |
| `POST /api/evaluations/run` | Run the golden suite |
| `GET /api/evaluations/runs/:id` | Read one evaluation run |

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Zod, Drizzle, and Playwright. Demo mode uses a durable JSON file. PostgreSQL is optional. Anthropic, Voyage embeddings, and Resend are optional and off by default.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Demo mode needs no API keys. Answers are composed from approved sources, retrieval is lexical, and emails are captured in the in-app sink and labeled `previewed`.

## Environment

See `.env.example`.

- `DEMO_MODE=true` keeps answers deterministic and email in the preview sink. An Anthropic key is ignored while this is on.
- `STORAGE_DRIVER=auto` uses Postgres when `DATABASE_URL` is set, otherwise `.data/proofdesk.json`.
- `ANTHROPIC_MODEL` defaults to `claude-sonnet-5` for the optional generator.
- Leave `MODEL_INPUT_USD_PER_MILLION` and `MODEL_OUTPUT_USD_PER_MILLION` unset unless you have a price you are willing to stand behind. No vendor price list was fetched on 24 November 2026.
- `RESEND_API_KEY` plus `DEMO_EMAIL_TO` is required before any real send. Demo mode never sends.
- `CRON_SECRET` protects `POST /api/cron/inactivity` outside demo mode.

## PostgreSQL

```bash
docker compose up -d
cp .env.example .env.local
# DEMO_MODE=true
# STORAGE_DRIVER=postgres
# DATABASE_URL=postgresql://proofdesk:proofdesk@localhost:5432/proofdesk
npm run db:migrate
npm run db:seed
npm run dev
```

`npm run db:reset` reseeds the configured store.

## Tests

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm run verify` runs lint, typecheck, unit tests, and the production build.

## Answer endpoint

Replace the host with the deployed origin before a public demo. This shape was checked against the local server.

```bash
curl -sS -X POST http://127.0.0.1:3000/api/answer \
  -H 'Content-Type: application/json' \
  -d '{"question":"How do I export only paid attendees?"}'
```

The JSON includes `answer`, `decision`, `sources`, `escalate`, `escalationReason`, `conversationId`, `model`, `mode`, `latencyMs`, `estimatedCostUsd`, and `traceId`. In demo mode the paid-attendee question returns `decision: "answer"`, source key `kb-attendee-export`, `mode: "deterministic-demo"`, `escalate: false`, and `estimatedCostUsd: 0`.

## Deployment

```bash
npm run build
npm run start
```

Set `NEXT_PUBLIC_APP_URL` to the public origin. On Vercel the file store uses `/tmp/proofdesk`, because the function filesystem cannot create `.data`. That copy lasts for one warm instance and is not shared across instances. For a store that survives restarts, set `DATABASE_URL`, then run `npm run db:migrate` and `npm run db:seed`.

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Demo script](docs/DEMO.md)
- [Model, cost, and scope disclosure](docs/DISCLOSURE.md)
- [Submission paste](docs/SUBMISSION.md)

## Limitations

- One process owns the file store. A second server does not share it. Restarting clears the in-memory rate limit and model circuit breaker.
- There is no login. The agent desk is open. Mutations check same-origin only.
- Demo email is previewed, not sent. The two export questions share one approved answer.
- Postgres, Voyage, Anthropic, and Resend are optional and off in the default demo.
- A public incognito check is not done until a URL is actually deployed.

Details are in [docs/DISCLOSURE.md](docs/DISCLOSURE.md).
