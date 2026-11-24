# OpenCode repair prompt — audit and fix the existing ProofDesk app

Copy everything below the divider into your coding agent.

---

You are repairing an existing fellowship application. Do **not** redesign or rebuild it from scratch.

Repository: the current ProofDesk project  
Track: YARC Builder Fellowship Track 05 — Support  
Primary objective: turn the polished prototype into a truthful, persistent, end-to-end working application before submission.

## Required first step: independent review

Before editing code:

1. Inspect the complete repository, excluding generated folders.
2. Read:
   - `README.md`
   - `docs/UI_FUNCTIONALITY_AUDIT.md`
   - `docs/TECHNICAL_REPORT.md`
   - `docs/DESIGN_DIRECTION_V2.md`
   - package scripts, APIs, components, support engine, journeys, and tests.
3. Install dependencies using the repository’s package manager.
4. Run tests, lint, typecheck if available, and production build.
5. Start the application and test all reviewer-facing routes at desktop and 390 × 844.
6. Independently click every visible button and link.
7. Write `docs/AGENT_REVIEW.md` containing:
   - confirmed findings;
   - findings you disagree with and why;
   - additional bugs;
   - root cause for each P0/P1 issue;
   - exact repair plan and files expected to change.

Do not merely repeat the supplied audit. Verify it.

After writing the review, continue directly into repairs. Do not stop and ask for approval unless a destructive action or external secret is required.

# Preserve these strengths

Do not replace or significantly restyle:

- Orbit’s forest/ink/lime visual identity;
- the landing-page structure and product mockup;
- the customer chat composition;
- the three-panel agent inbox;
- handoff-packet information order;
- lifecycle event → condition → message → exit layout;
- deterministic answer/clarify/abstain/escalate policy;
- existing working API contracts unless a backwards-compatible extension is needed.

This is a functionality and credibility repair, not another UI redesign.

# Confirmed current baseline

The previous audit observed:

```text
Tests:                   28 passed
Lint:                    passed
Production build:        passed
Runtime console errors:  0
Failed browser requests: 0
Desktop overflow:        none
390 × 844 overflow:      none
Invalid API question:    HTTP 400
Oversized API question:  HTTP 400
Health endpoint:         HTTP 200
```

Working behavior:

- grounded paid-attendee answer;
- deterministic policy tests;
- customer chat on desktop/mobile;
- same-browser duplicate-charge handoff;
- journey preview-sink API;
- local seeded inbox and knowledge reader.

Do not regress these.

# P0 repairs

## 1. Add durable persistence

Current customer messages/handoffs are reconstructed from localStorage, while agent replies, ownership, resolution, journey runs, and delivery history disappear after reload.

Use an explicit repository/storage layer.

- Prefer an existing configured database if the repository already has one.
- If none exists, use **libSQL/Turso with Drizzle** so the same code can use a local file URL during development and a remote Turso URL when deployed.
- Do not use process-global memory as “persistence.”
- Keep a clearly isolated demo adapter only if necessary for tests.

Minimum persisted entities:

- conversations;
- messages;
- handoffs;
- assignment/status history;
- customer events;
- journey runs;
- deliveries;
- evaluation runs;
- evaluation results.

Add migrations and an idempotent seed command. Add `.env.example` variables and exact setup instructions.

## 2. Make customer → agent handoff truly end to end

On escalation:

1. persist the conversation and all messages;
2. persist sources and policy decision;
3. build and persist the complete handoff packet;
4. assign a queue;
5. return `handoffId` and `conversationId`;
6. make `/desk` fetch the queue from the server;
7. ensure another browser context can see the same handoff.

Required packet fields:

- customer goal;
- summary;
- escalation reason;
- risk class;
- sentiment;
- attempted steps;
- sources consulted;
- claims already communicated;
- missing information;
- recommended next action;
- destination queue;
- complete transcript.

Keep localStorage only as an offline/session convenience, not as the source of truth.

## 3. Persist all agent actions

Implement server-backed:

- take ownership;
- reply;
- resolve;
- reopen;
- priority/status changes needed by the existing UI.

After refresh, the exact conversation, reply, owner, and state must remain.

Use optimistic UI only with rollback on API failure. Show clear loading/error state.

## 4. Persist lifecycle execution

`POST /api/events` must persist:

- incoming event;
- selected journey;
- enrollment or suppression decision and reason;
- rendered subject/HTML/text;
- provider mode;
- delivery state;
- timestamps and error.

`/journeys` must load history from the repository. Reload must preserve the recent run.

Keep public demo delivery safe:

- default to preview sink;
- if Resend is configured, send only to the exact allowlisted `DEMO_EMAIL_TO` address;
- reject arbitrary recipients;
- never silently claim an email was sent when it was only previewed.

## 5. Make Trust Center real

The current Run Suite and Compare Run controls are no-ops and metrics are fixtures.

Implement:

- `POST /api/evaluations/run`;
- execution of the existing 20 golden cases through the real support engine;
- deterministic checks for decision, primary source, risk, escalation, and prohibited actions;
- persisted run and case results;
- measured duration and configured cost estimate;
- `GET /api/evaluations/runs` and a run detail endpoint or equivalent server actions;
- Run Suite loading/progress/error/success UI;
- run history and comparison if Compare remains visible;
- metrics derived only from stored results.

If run comparison cannot be completed within scope, remove or visibly disable that control with an honest reason. Do not leave it enabled and inert.

# P1 repairs

## 6. Audit every visible control

Create a control inventory and test each control.

Currently observed no-op controls include:

- Home: Sign in
- Home: Create your first event
- Home: Manage event
- Desk: New conversation
- Desk: global Search
- Journeys: New/Add journey
- Journeys: View definition
- Trust: Run suite / Compare run
- Knowledge: Import / New source
- navigation collapse, Help, and More controls

Rules:

- Implement controls essential to the fellowship demo.
- For nonessential fake-product controls, remove them, link to an existing meaningful demo state, or disable them with visible “Orbit demo” explanation.
- Never leave an enabled button that silently does nothing.
- Do not build a large authentication/product system merely to make the fictional Orbit Sign In work; a transparent demo modal or removal is acceptable.

## 7. Improve evidence precision

The paid-attendee question currently returns the correct answer but displays three sources.

- Calibrate the source inclusion threshold and/or score delta.
- Return the strongest sufficient sources rather than padding the evidence list.
- Preserve `kb-attendee-export` as the primary source.
- Add a regression test that unrelated sources are excluded.
- Keep explicit abstention when no source passes the threshold.

## 8. Make Knowledge actions honest

Minimum acceptable implementation:

- create source;
- edit source;
- archive/restore source;
- re-index source;
- display version, owner, effective date, and indexed date.

If Import is retained, restrict it to pasted text/Markdown or a validated file. Do not add arbitrary URL crawling in this repair.

Persist knowledge operations. Re-index must affect retrieval.

## 9. Add application-level safeguards

Implement:

- server-side request/session rate limiting with a safe local fallback;
- strict organization scoping in repository methods;
- no full-transcript logging to stdout;
- sanitized rendered user text;
- appropriate security headers;
- a documented demo-agent access strategy.

Do not delay the core demo for a large authentication system. Be explicit about what is and is not protected.

# UI/accessibility repair

## 10. Increase operational readability

Do not change the visual identity. Increase only undersized product text:

- message content: 14–16 px;
- actionable labels: at least 13–14 px;
- secondary evidence/timestamps: at least 12 px where practical;
- preserve monospace metadata but keep it legible.

Check at 1280, 1440, and mobile widths.

## 11. Fix accessible labels and hit targets

Add accurate accessible names to every icon-only control, including:

- customer-context More button;
- journey desktop/mobile preview toggles;
- any other control discovered by the audit.

Ensure:

- visible focus;
- keyboard operation;
- 40–44 px mobile hit targets;
- status changes exposed through `aria-live` where appropriate;
- no risk state communicated through color alone.

Improve spacing around the mobile chat status line and bottom protection/close controls without redesigning the widget.

# Required API behavior

Preserve `POST /api/answer`. Extend it so persisted requests return server IDs:

```json
{
  "answer": "…",
  "decision": "answer|clarify|abstain|escalate",
  "risk": "low|medium|high",
  "sources": [],
  "claims": [],
  "signals": [],
  "escalate": false,
  "escalationReason": null,
  "handoffId": null,
  "conversationId": "…",
  "model": "…",
  "latencyMs": 0,
  "estimatedCostUsd": 0,
  "traceId": "…"
}
```

Add the minimal endpoints/server actions for:

- conversation list/detail;
- agent reply and status/ownership updates;
- journey run history;
- evaluation execution/history;
- knowledge CRUD/re-index.

Validate every request with Zod and return useful non-200 errors.

# Required browser tests

Add Playwright tests that fail before the repair and pass afterward:

1. Paid-attendee question returns grounded answer and only relevant evidence.
2. Unsupported auditorium request abstains and attaches no weak source.
3. Duplicate-charge escalation created in Browser Context A appears in `/desk` in Context B.
4. Agent reply and resolution persist after reload.
5. Lifecycle test run and preview delivery persist after reload.
6. Run Suite makes a real request, persists results, and updates metrics.
7. Every visible enabled reviewer-facing control has an observable outcome.
8. Mobile chat fits a 390 × 844 viewport and remains keyboard/touch usable.
9. No console errors or failed first-party requests occur on `/`, `/desk`, `/journeys`, `/trust`, and `/knowledge`.

Keep and extend the existing unit tests.

# Acceptance criteria

Do not call the repair complete until:

- customer conversation persists server-side;
- escalation appears in another browser context;
- agent reply/owner/status survive reload;
- journey and delivery history survive reload;
- Trust Center runs real cases and stores results;
- metrics are derived from results, not hard-coded;
- paid-attendee evidence is precise;
- no prominent enabled control is inert;
- no important console text is below 12 px;
- all icon-only controls have names;
- tests, lint, typecheck, and production build pass;
- README and technical report match the actual implementation.

# Verification commands

Add/fix scripts as needed, then run the repository equivalents of:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Also run database migration and seed from a clean local database and document the exact commands.

# Required final artifacts

Create:

- `docs/AGENT_REVIEW.md` — independent pre-fix review;
- `docs/FIX_REPORT.md` — findings fixed, deferred, and evidence;
- updated `README.md`;
- updated `.env.example`;
- migrations and seed;
- browser test files.

`FIX_REPORT.md` must include:

1. root causes;
2. files changed;
3. schema/migration summary;
4. which controls were implemented, removed, or disabled;
5. before/after evidence for persistence;
6. real vs previewed vs deterministic integrations;
7. exact commands run and their results;
8. remaining limitations and deployment secrets needed.

# Final response to the user

Return a concise summary plus the complete contents or paths of `AGENT_REVIEW.md` and `FIX_REPORT.md`. Explicitly state:

- what remains broken;
- whether a second browser can see a new handoff;
- whether replies/journey runs/evaluation runs survive reload;
- whether every visible reviewer-facing button now has an outcome;
- whether all verification commands passed.

Do not claim production readiness. Call it a working fellowship prototype unless authentication, durable hosted storage, tenant isolation, rate limiting, and security validation genuinely exist.
