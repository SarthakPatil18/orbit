# Architecture

ProofDesk is a Next.js App Router application. Pages stay thin. Policy, retrieval, handoffs, journeys, and evaluation live under `src/lib`. Every repository method is scoped by `organizationId`.

```text
chat or POST /api/answer
        │
        ▼
answerQuestion
        │
        ├─ expandRetrievalQuery (follow-ups use the previous customer question)
        ├─ retrieveEvidence
        ├─ decideAutonomy          answer | clarify | abstain | escalate
        ├─ compose answer          deterministic demo, deterministic fallback, or model
        └─ buildHandoffPacket      only when the policy escalates
                │
                ▼
        Store (file JSON or Postgres)
```

## Answer pipeline

`src/lib/ai/answer.ts` owns `answerQuestion`.

1. `POST /api/answer` validates the body, rate-limits per IP and session, and checks same-origin. A request with no `Origin`, including curl, is allowed. A cross-origin browser POST is rejected.
2. The turn loads the conversation when `conversationId` is present. A short follow-up, or one that starts with only, just, except, or but, expands retrieval from the previous customer question. The assistant’s previous answer is not used as the query.
3. `retrieveEvidence` in `src/lib/knowledge/retrieval.ts` scores chunks with lexical and IDF weights, plus authority, freshness, margin, and contradiction checks. The answer threshold is `0.35`. A margin under `0.02` when the top score is under `0.65` is not enough to answer. Terms that appear in no chunk do not wipe an otherwise matching score. PostgreSQL mode adds full-text search. File mode stays deterministic. `publicSourceKey` maps the leftover slug `exporting-attendees` to `kb-attendee-export`.
4. `decideAutonomy` in `src/lib/support/policy.ts` selects the decision from evidence and signals. The model is never asked to choose. Policy version is `policy-2026.11.1`.
5. Demo mode composes the reply from the top source’s approved answer and labels the turn `deterministic-demo`. It does not pretend a provider failed. If the model is enabled and the key is missing, the provider errors, the call exceeds 12 seconds, or the circuit breaker is open, the turn is degraded: the label is “Model/provider unavailable”, `mode` is `deterministic-fallback`, and the approved answer is still used. A live model call must pass claim checks against the cited excerpts.
6. Escalation builds a handoff with `buildHandoffPacket` and stores it as `pending_confirmation`. The widget can confirm it. The packet carries the customer goal, summary, full transcript, reason, risk, sources consulted, actions already taken, missing information, and the recommended next action.
7. Messages, citations, the trace, and an audit entry are persisted. `traceId` is returned to the client.

Sensitive actions are never executed. Refunds, deletions, identity changes, payment-detail changes, and workspace transfers stay with a person.

### Decision order

1. Payment or refund exception → escalate, high, Billing.
2. Security concern → escalate, high, Trust & Safety.
3. Deletion or identity exception → escalate, high, Trust & Safety.
4. Instruction-boundary attempt that asks for a sensitive action → escalate, high, Trust & Safety.
5. Hidden system or developer instructions → abstain.
6. A promise about a third-party outcome → abstain.
7. Out of product scope, including venue reservation → abstain.
8. An explicit request for a person → escalate, medium.
9. Repeated failure or repetition → escalate, medium.
10. Strong frustration → escalate, medium.
11. Ambiguous or vague questions → clarify.
12. Stale or conflicting sources → abstain.
13. Sufficient evidence → answer.
14. Otherwise → abstain.

Retrieved text and customer text cannot override this order.

The paid-attendee article has one approved answer. “How do I export everyone registered for our hackathon?” and “Only those who paid, though.” both return the Paid-filter procedure from `kb-attendee-export` (title “Exporting attendees”, version 2.4, effective 2026-10-18). The follow-up keeps the conversation and the Paid excerpt. It is not a second export mode.

Support hours shown in chat are weekdays 09:00–18:00 Asia/Kolkata. Outside that window the same handoff still transfers the transcript and says the desk is offline.

Copy stays plain and specific. Answers cite a source. Abstentions say the source does not cover the request. Escalations say what was not done, including that nothing was refunded, and that the transcript travels with the handoff.

## Conversation and handoff

The chat widget keeps the thread in `sessionStorage` under `proofdesk.widget.v1` and on the server conversation. A new conversation starts a new thread. Escalation links to `/desk?conversation=<id>`.

The desk opens that conversation. Relative times use a server clock captured before render (`src/lib/server-now.ts`) so the page does not hydrate a different “now”.

## Lifecycle email

`processLifecycleEvent` in `src/lib/email/lifecycle.ts` matches a journey, checks the condition, entry limit, and exit, renders the email, and records the delivery.

| Journey | Trigger | What the demo shows |
| --- | --- | --- |
| Welcome | `user.created` | Immediately. Subject like “Your club has a new home, Reviewer”. |
| Inactivity nudge | `user.inactive` | Inactive 7 or more days with an unfinished draft. Cron timing 09:30. |
| Feature update | `feature.released` | Release `offline-checkin-v1` and an upcoming event. Dedupe key is club plus release. |
| Offboarding | `subscription.cancelled` | Pro end date in the subject. The date is formatted, not left as an ISO string. |

`testJourney` creates a fresh sample customer with a unique club so a feature test does not collide with an earlier one. A second feature test for the same club and `offline-checkin-v1` is `suppressed`.

Demo `attemptDelivery` returns `previewed` with provider `demo-sink`. It does not mark the message sent. With Resend configured and demo mode off, mail goes only to `DEMO_EMAIL_TO`. Templates live in `src/lib/email/templates` and refuse unresolved `{{placeholders}}`.

Welcome, inactivity, and offboarding dedupe by customer. Other accepted event names (`subscription.reactivated`, `event.published`, `draft.deleted`, `reminder.snoozed`, `feature.adopted`, `event.completed`) are part of the event contract and are not separate demo journeys.

## Knowledge

Seeded sources live in `src/data/seed/knowledge.ts`. The set includes a stale SMS pilot and a superseded refund policy so conflict and freshness checks have something to refuse. Chunking is by heading in `src/lib/knowledge/chunking.ts`. Source create, update, archive, and reindex go through `src/lib/knowledge/sources.ts`.

## Evaluation

Twenty golden cases live in `src/data/seed/cases.ts`. `runEvaluationSuite` in `src/lib/evaluation/suite.ts` runs each case through the real answer pipeline and stores the run. `releaseGates` in `src/lib/evaluation/gates.ts` is shared by the server and the Trust Center: decision accuracy at least 90 percent, escalation recall 100 percent, unsupported abstain rate 100 percent, citation coverage 100 percent, and unnecessary escalation at most 10 percent. The Trust Center button runs these cases. It does not display a canned score.

## Database

`src/lib/database/contract.ts` is the `Store` interface. `src/lib/database/index.ts` picks the adapter. The file adapter writes `.data/proofdesk.json` atomically and reseeds when `SEED_VERSION` changes, keeping a backup of the previous file. The Postgres adapter is `src/lib/database/postgres-store.ts`, with the Drizzle schema in `src/lib/database/schema.ts` and SQL in `drizzle/`.

Tables: `organizations`, `agents`, `customers`, `queues`, `knowledge_sources`, `knowledge_chunks`, `conversations`, `messages`, `citations`, `handoffs`, `customer_events`, `journeys`, `journey_enrollments`, `journey_runs`, `deliveries`, `eval_cases`, `eval_runs`, `eval_results`, `audit_logs`.

## API contract

`POST /api/answer` returns:

| Field | Meaning |
| --- | --- |
| `answer` | Customer-facing text |
| `decision` | `answer`, `clarify`, `abstain`, or `escalate` |
| `sources` | Cited sources. Empty when the decision abstains with no usable source |
| `escalate` | Whether a handoff was created |
| `escalationReason` | Why, or null |
| `conversationId` | Server conversation |
| `model` | `deterministic-policy` in demo mode, otherwise the configured model name |
| `mode` | `deterministic-demo`, `deterministic-fallback`, or `model` |
| `latencyMs` | Server time for the turn |
| `estimatedCostUsd` | `0` for deterministic turns |
| `traceId` | Id prefixed with `trace_` |
| `risk`, `signals`, `claims`, `degraded`, `supportStatus` | Decision trace for the desk and widget |

Other routes under `src/app/api` cover conversations and agent actions, handoff confirm, journeys and previews, deliveries, knowledge, audit, events, evaluations, health, the inactivity cron, and a demo reset. Response fields for those routes are the stored records those handlers already return.

## Tradeoffs

- The file store lets the demo run without Docker. It is one process. Postgres is the deployment path and is not required for review.
- Retrieval stays lexical so a review is repeatable. Voyage embeddings are optional and off.
- The model is optional so a missing key cannot change the decision. Demo mode skips Anthropic even if a key is present.
- Email renders for real and is delivered to a preview sink in demo mode, so the reviewer can read the final copy without sending mail.
- Rate limiting and the model circuit breaker are in memory. They reset when the process restarts.
- There is no login. Same-origin checks are the mutation guard. This is acceptable only for a local demo.

## Where it fails closed

- Thin, stale, or conflicting evidence abstains. No weak source is attached.
- Provider failure uses the deterministic answer and says the provider is unavailable.
- Payment, security, privacy, deletion, frustration, two failures, an explicit request for a person, and prompt or policy bypass escalate. Nothing in that path refunds, deletes, or changes payment details.
- A journey that fails its condition or dedupe rule is `suppressed` or otherwise not labeled sent.
- A preview is never labeled sent.
