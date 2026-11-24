# Submission copy

Paste these values into the YARC form. Replace the two placeholders before submitting. Do not invent a URL.

**Project:** ProofDesk — evidence-conditioned AI support for Orbit

**Track:** YARC Builder Fellowship, Track 05 Technology

**One-liner:** ProofDesk answers campus-event support only from approved Orbit sources, shows the evidence, and hands the same transcript to a person when payment, security, privacy, or uncertainty requires it.

## GitHub repository URL

```text
[PASTE REPOSITORY URL]
```

## Deployed demo URL

```text
[PASTE DEPLOYED DEMO URL]
```

No public URL was verified on 24 November 2026. Leave this blank until a deployment answers `GET /api/health` and the chat on `/` in a private window.

## Architecture & Decisions

ProofDesk is a Next.js prototype for Orbit, a fictional campus-event product. A deterministic policy chooses answer, clarify, abstain, or escalate before any optional model writes. Retrieval is lexical over an approved knowledge base. The paid-attendee export answer cites `kb-attendee-export` only. Unknown requests, including auditorium booking, abstain with no source. Payment disputes, security, privacy or deletion, strong frustration, two failures, an explicit request for a person, and prompt or policy bypass create a handoff packet with the goal, summary, full transcript, reason, risk, sources, actions, missing information, and next step. Nothing in chat refunds, deletes, or changes payment details. Four lifecycle journeys — welcome (`user.created`), inactivity (`user.inactive` after seven days with a draft), feature update (`feature.released`), and offboarding (`subscription.cancelled`) — render final copy and record `previewed`, `sent`, `failed`, or `suppressed`. Demo mode previews email in an in-app sink and does not call a model. The Trust Center runs the real 20-case suite. Storage defaults to one local JSON file, with an optional Postgres adapter.

## Model and cost disclosure

Demo mode composes answers with the deterministic policy. The optional generator is `claude-sonnet-5` (`ANTHROPIC_MODEL`). It was selected so a short draft can be written from approved excerpts while the policy, not the model, still owns the decision. It is not called while `DEMO_MODE=true`. If it is enabled and the provider is missing, errors, times out at 12 seconds, or the circuit breaker is open, the turn is labeled model/provider unavailable and the deterministic answer is used.

Deterministic answers cost $0. No vendor price list was fetched on 24 November 2026. `MODEL_INPUT_USD_PER_MILLION` and `MODEL_OUTPUT_USD_PER_MILLION` are unset, so no model dollar amount is estimated. If an operator sets both, estimated cost is `(input tokens × input rate + output tokens × output rate) / 1,000,000`. Preview-sink email costs $0. No email-provider price is claimed. A configured Resend key sends only to `DEMO_EMAIL_TO`.

## Known limitations

- One process owns the file store at `.data/proofdesk.json`. A second server does not share it. Restarting clears the in-memory rate limit and model circuit breaker.
- There is no login. The agent desk is open. Mutations check same-origin only. Curl with no `Origin` is allowed. Do not store real customer data.
- Demo email is previewed, not sent. A second feature-update test for the same club and release is suppressed on purpose.
- “Everyone registered” and “only those who paid” both use the one approved export answer. The follow-up keeps the conversation and the Paid excerpt.
- Human-hours copy follows weekdays 09:00–18:00 Asia/Kolkata. Outside that window the handoff still transfers the transcript and says the desk is offline.
- Postgres, Voyage embeddings, Anthropic, and Resend are optional and off in the default demo.
- The public deployment and incognito check are not done until a URL is actually deployed.
