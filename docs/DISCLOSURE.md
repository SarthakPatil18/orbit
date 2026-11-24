# Disclosure

Checked against the local demo on 24 November 2026. `DEMO_MODE=true`. Storage driver `file`. No vendor price list was fetched that day.

## Model

Demo mode does not call a model. `answerQuestion` composes the reply from the approved source text after `decideAutonomy` has already chosen the decision. The widget label is **Deterministic demo**. `mode` is `deterministic-demo`. `model` is `deterministic-policy`.

The optional generator is `ANTHROPIC_MODEL`, default `claude-sonnet-5`. It was selected so a short draft can be written from approved excerpts while the policy, not the model, still owns answer, clarify, abstain, or escalate. The key is ignored while `DEMO_MODE=true`, including when a key is present, so a review stays repeatable.

## Deterministic fallback

If demo mode is off and the model is enabled, a missing key, a provider error, a timeout of 12 seconds, or an open circuit breaker degrades the turn. The customer sees “Model/provider unavailable”. `mode` is `deterministic-fallback`. The approved deterministic answer is used. Demo mode does not use that label, because the provider was never called.

## Price and estimated cost

No vendor price list was fetched on 24 November 2026. `MODEL_INPUT_USD_PER_MILLION` and `MODEL_OUTPUT_USD_PER_MILLION` are unset, so no model dollar amount is estimated. `costBasis` is `pricing-unconfigured` when a model turn has no rates, and `no-charge-deterministic` for policy answers.

Deterministic answers cost $0. `estimatedCostUsd` is `0`.

If an operator sets both rates, the estimate is:

```text
(input tokens × input rate + output tokens × output rate) / 1,000,000
```

That is the operator’s rate, not a published vendor price.

A paid-attendee answer measured on the local server returned `estimatedCostUsd: 0`, `latencyMs: 11`, and a `trace_` id. Latency will vary. The cost of a deterministic turn will not.

## Email

Demo deliveries are rendered and stored in the in-app sink. Status is `previewed`. Provider is `demo-sink`. `sentAt` is null. Preview-sink cost is $0. No Resend price is claimed.

Resend is used only when demo mode is off, `RESEND_API_KEY` is set, and the recipient is `DEMO_EMAIL_TO`. Anything else is refused. A configured send is the only path that can record `sent`.

## What is real, and what is previewed

| Piece | In the default demo |
| --- | --- |
| Answer decision and citations | Real policy and retrieval over the seeded sources |
| Model wording | Not called |
| Embeddings | Off. Lexical retrieval, plus Postgres full-text search when that adapter is on |
| Email body | Really rendered |
| Email delivery | Previewed, not sent |
| Evaluation button | Runs the 20 seeded cases through the answer pipeline |
| Inactivity cron | Open in demo mode. Requires `CRON_SECRET` outside demo mode |
| Persistence | Real for the one process that owns the file, or for Postgres when configured |

## Persistence

The default file is `.data/proofdesk.json`. Conversations, handoffs, journey runs, and deliveries survive a refresh on that instance. Changing `SEED_VERSION` reseeds the file and writes a backup, which drops prior local demo conversations.

PostgreSQL is optional. Set `DATABASE_URL`, then `npm run db:migrate` and `npm run db:seed`.

The chat also keeps the open thread in `sessionStorage` (`proofdesk.widget.v1`).

## What breaks first

A second server does not share the file store. The in-memory rate limiter and the model circuit breaker reset on restart. There is no login, so the desk is open to anyone who can reach it. Same-origin is the mutation check. Do not put real customer data here.

Human-hours copy follows Asia/Kolkata. Outside weekdays 09:00–18:00 the handoff still transfers the transcript and says the desk is offline.

“Everyone registered” and “only those who paid” share one approved export answer. A second feature-update test for the same club and `offline-checkin-v1` is suppressed on purpose.

## Security and scope

- No authentication, billing, or multi-tenant production isolation.
- Mutations are same-origin only. Curl with no `Origin` is allowed so the documented endpoint can be called.
- The product does not reserve rooms, issue refunds, delete accounts, or change payment details.
- Optional integrations that are off unless configured: Anthropic, Voyage, Resend, Postgres.
- A public deployment and a clean incognito check are not done until a URL is actually deployed.
