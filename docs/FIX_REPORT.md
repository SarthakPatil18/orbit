# Fix report

24 November 2026. Scope was the YARC reviewer journey in `OPENCODE_SUBMISSION_SPRINT.md`. The Orbit landing page, ProofDesk chat, agent desk, journeys, knowledge UI, and trust layout were kept. This is a working fellowship prototype, not production software.

## What changed for the reviewer path

- Attendee export is published as `kb-attendee-export`. A leftover slug still maps to that key.
- “Registered” retrieves the attendee-export article. Terms that appear in no chunk no longer wipe the score. Short follow-ups expand from the previous customer question, so “Only those who paid, though.” stays on the export article.
- Chat shows checking sources, explicit unknown, escalation, deterministic demo, model/provider unavailable, online or offline human hours (weekdays 09:00–18:00 IST), retry, and source title, key, version, update date, and excerpt. The session survives refresh. Escalation links to `/desk?conversation=<id>`.
- The desk opens that conversation and shows the handoff packet: goal, summary, transcript, reason, risk, sources, actions, missing information, and next action. Relative times use the server clock so the desk does not hydrate a different “now”.
- Test journey creates a fresh customer with a unique club and fires that journey’s trigger. Demo delivery is `previewed` / `demo-sink`. Rendered mail has no `{{placeholders}}`. Repeating the same club and release is `suppressed`.
- `/trust#disclosure` states the model, fallback, preview email, cost assumptions dated 24 November 2026, what breaks first, persistence, and the open desk.
- Trust “Run the 20-case suite” executes the existing golden cases.

## Files touched for this sprint

- `src/components/chat-widget.tsx`
- `src/components/desk/desk-workspace.tsx`
- `src/components/journeys/journeys-workspace.tsx`
- `src/components/trust/trust-workspace.tsx`
- `src/app/desk/page.tsx`
- `src/app/journeys/page.tsx`
- `src/app/trust/page.tsx`
- `src/app/globals.css`
- `src/app/api/journeys/route.ts`
- `src/app/api/journeys/[id]/test/route.ts`
- `src/lib/server-now.ts`
- `src/lib/services/answer.ts`
- `src/lib/services/retrieval.ts`
- `src/lib/services/handoff.ts`
- `src/lib/services/lifecycle.ts`
- `src/lib/services/email.tsx`
- `src/lib/seed/knowledge.ts`
- `src/lib/seed/index.ts`
- `src/lib/types.ts`
- `e2e/critical.spec.ts`
- `tests/reviewer-journey.test.ts`
- `tests/retrieval.test.ts`
- `README.md`
- `.env.example`
- `docs/FINAL_CHECKLIST.md`
- `docs/DEMO_SCRIPT.md`
- `docs/SUBMISSION_COPY.md`
- `docs/FIX_REPORT.md`

Bumping the seed version reseeds `.data/proofdesk.json` on the next store init and writes a backup. Local demo conversations from before that reseed are not kept.

## Commands and results

Run on 24 November 2026 from the repository root.

| Command | Result |
| --- | --- |
| `npm run lint` | Pass. |
| `npm run typecheck` | Pass. |
| `npm test` | Pass. 10 files, 24 tests. |
| `npx playwright test` | Pass. 24 tests: 12 Chromium and 12 Pixel 7, 55.6s. Includes the four chat cases, desk packet, four journey tests, `POST /api/answer`, 390×844 chat, and zero console errors or failed first-party requests. |
| `npm run build` | Pass. Next.js 16.4.6. Routes `/`, `/desk`, `/journeys`, `/knowledge`, `/trust`, `/api/health`, and `/api/answer` are dynamic. |

`GET http://127.0.0.1:3000/api/health` returned `status: ok`, `demoMode: true`, storage driver `file`, Anthropic off, Resend `sink`.

`POST http://127.0.0.1:3000/api/answer` with “How do I export only paid attendees?” returned:

- `decision`: `answer`
- `sources[0].key`: `kb-attendee-export`
- `sources[0].title`: Exporting attendees
- `sources[0].version`: `2.4`
- `sources[0].effectiveDate`: `2026-10-18`
- `mode`: `deterministic-demo`
- `model`: `deterministic-policy`
- `escalate`: false
- `estimatedCostUsd`: 0
- `latencyMs`: 11
- `traceId`: `trace_ea77a2e5df7c46eb`
- `conversationId`: present

Browser walk on that same server: paid export with the source card; memory follow-up on the same thread; auditorium abstain with no source; duplicate-charge handoff; desk packet for conversation `4de6ea26-4b00-4739-9e7d-1bc4fb639750`; all four Test journey actions labeled `previewed` with resolved subjects and no `{{`.

## Deployed-mode requirements

Default demo needs no secrets.

| Variable | When |
| --- | --- |
| `DEMO_MODE=true` | Deterministic answers and preview email. |
| `NEXT_PUBLIC_APP_URL` | Public origin, used for same-origin checks. |
| `STORAGE_DRIVER` / `PROOFDESK_DATA_DIR` | File store. Use a persistent disk if the host has more than one instance. |
| `DATABASE_URL` | Optional Postgres. Then `npm run db:migrate` and `npm run db:seed`. |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Optional. Ignored while demo mode is on. |
| `MODEL_INPUT_USD_PER_MILLION`, `MODEL_OUTPUT_USD_PER_MILLION` | Optional operator rates. Unset means no estimated model price. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `DEMO_EMAIL_TO` | Optional. Sends only to the allowlisted address. |
| `CRON_SECRET` | Required before exposing `POST /api/cron/inactivity` outside demo mode. |

## Remaining limitations

- No public URL. Incognito against a deployed origin was not run.
- File store is single-process. Rate limit and circuit breaker are in memory.
- No authentication. The desk is open. Same-origin is the mutation check.
- Demo mail is previewed. Feature dedupe suppresses a repeated release for the same club.
- The two export questions share one approved answer.
- Offline human hours appear only outside weekdays 09:00–18:00 IST.
- Model, embeddings, and Resend stay off until their keys are set. No live price was fetched on 24 November 2026.
