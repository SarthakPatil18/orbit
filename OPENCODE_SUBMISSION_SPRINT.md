# OpenCode submission-sprint prompt — ProofDesk

Use this prompt instead of attempting a production-platform rebuild before the YARC deadline.

---

You are finishing an existing YARC Builder Fellowship Track 05 Technology submission. The deadline is 26 November 2026, 11:59 PM IST. The brief explicitly says **working beats polished**.

Do not redesign the current application and do not build unrelated platform infrastructure. Preserve the current Orbit landing page, ProofDesk chat, agent inbox, journeys, knowledge UI, and trust-first visual identity.

Your job is to make the exact reviewer journey reliable, remove prototype traps, produce submission evidence, and stop when every requirement in the Technology brief is demonstrably satisfied.

## First: audit current state

Read:

- `README.md`
- `docs/UI_FUNCTIONALITY_AUDIT.md`
- `docs/TECHNICAL_REPORT.md`
- `docs/DESIGN_DIRECTION_V2.md`

Run existing tests, lint, and build. Start the app and verify all routes. Write a short checklist of confirmed gaps, then begin repairs immediately.

# Exact Technology requirements to satisfy

## 1. Grounded chat

The public Orbit product page must include a working chat widget.

The reviewer must be able to demonstrate these four scenarios:

### Grounded answer

Question:

```text
How do I export only paid attendees?
```

Expected:

- specific actionable answer;
- `kb-attendee-export` as the primary source;
- source title, relevant excerpt, version, and update date visible;
- exclude unrelated weak sources.

### Conversation memory

Sequence:

```text
How do I export everyone registered for our hackathon?
Only those who paid, though.
```

Expected: the second turn resolves the previous export context and explains the Paid filter.

### Explicit unknown

Question:

```text
Can Orbit reserve our auditorium?
```

Expected:

- explicit statement that reliable information is unavailable;
- no invented capability;
- no weak source attached;
- offer a human handoff.

### Hard escalation

Question:

```text
I was charged twice for one ticket.
```

Expected:

- route to a human because payment verification is required;
- no refund promised or executed;
- customer sees that transcript/context will be transferred;
- agent view opens the exact same conversation.

Required failure states:

- checking sources;
- model/provider unavailable;
- offline human hours;
- explicit unknown;
- escalation;
- retry.

Persist conversation memory at least for the complete reviewer session and page refresh. If server persistence already exists or can be added safely, use it. Do not delay submission to build a complex multi-tenant backend.

## 2. Human routing

Document and implement exact routing triggers:

- explicit request for a person;
- payment/refund verification;
- security/account compromise;
- privacy/deletion exception;
- strong frustration;
- two repeated failures;
- prompt/policy bypass request.

The agent packet must contain:

- customer goal;
- concise summary;
- full transcript;
- escalation reason;
- risk;
- sources consulted;
- actions attempted;
- missing information;
- recommended next action.

The customer must not need to repeat the issue.

Agent reply persistence is desirable. The submission blocker is that the exact transcript and packet work reliably during the public demo.

## 3. Four lifecycle email flows

The `/journeys` page must show and successfully trigger:

1. welcome — `user.created`;
2. inactivity nudge — `user.inactive` after seven days with unfinished draft;
3. feature update — `feature.released` for relevant upcoming event;
4. offboarding — `subscription.cancelled`.

For every journey show:

- entry event;
- condition;
- timing;
- exit/cancellation rule;
- final subject;
- final body copy;
- HTML/mobile preview;
- result labeled honestly as `previewed`, `sent`, `failed`, or `suppressed`.

No unresolved `{{placeholders}}` may appear in the rendered email.

Public demo may use a safe preview sink. If Resend is configured, only send to an allowlisted environment address. Never claim “sent” when only previewed.

Make the current Test Journey action work for all four flows. Preserve run history for the current review session and refresh if practical.

## 4. HTTP endpoint

Keep and verify:

```http
POST /api/answer
```

Document a copy-paste curl command against the final deployed URL.

Return:

- answer;
- decision;
- sources;
- escalation boolean/reason;
- conversation ID;
- model/mode;
- latency;
- estimated cost;
- trace ID.

Run the command from a clean terminal before submission.

## 5. Full disclosure

Create/update a visible disclosure section and README covering:

- exact model used;
- why it was selected;
- deterministic/demo fallback;
- which email behavior is real vs previewed;
- measured or configured per-answer cost;
- per-email provider cost or preview cost;
- what breaks first;
- current persistence limitation;
- security and scope limitations.

Do not use stale provider prices as facts. Record pricing date and calculation assumptions.

## 6. Working prototype

The final deployment must expose:

- `/` — demo product and chat;
- `/desk` — human handoff;
- `/journeys` — all four mails;
- `/knowledge` — approved product content;
- `/trust` — evaluation/disclosure, only if honest;
- `/api/health`;
- `/api/answer`.

# Remove prototype traps

Audit every visible enabled button.

For any control not required by the Technology brief, either:

- connect it to a meaningful existing demo action;
- visibly disable it with a short “Orbit demo” explanation;
- or remove it.

Do not spend deadline time building:

- full Orbit authentication;
- a real event-management product;
- arbitrary web ingestion;
- organization billing;
- multi-agent orchestration;
- WhatsApp or voice;
- a large knowledge CMS;
- visual journey builder;
- full production tenancy.

Specifically fix or remove current no-op controls such as Sign in, Create event, Manage event, New conversation, New journey, Compare Run, Import, New Source, and other decorative controls.

The Trust Center’s **Run suite** button must either execute the real existing golden cases or be removed/disabled and the displayed cases clearly labeled as automated test fixtures. Never present hard-coded metrics as a live run.

# Minimum UI repair

Do not redesign. Only:

- increase operational text that is below 12 px;
- add missing accessible labels;
- ensure mobile controls have usable hit targets;
- keep visible focus states;
- fix cramped mobile chat status/footer spacing;
- preserve the current desktop/mobile layouts.

# Required tests

Keep all current tests passing and add a focused browser test or repeatable audit script for:

1. grounded paid-export answer and correct source;
2. conversation-memory follow-up;
3. unsupported auditorium abstention with no source;
4. duplicate-charge handoff with exact transcript/summary;
5. each of four journey triggers;
6. public endpoint curl-equivalent request;
7. 390 × 844 chat viewport;
8. no console errors or failed first-party requests.

# Submission deliverables

Create/update:

- `README.md`
- `.env.example`
- `docs/FINAL_CHECKLIST.md`
- `docs/DEMO_SCRIPT.md`
- `docs/SUBMISSION_COPY.md`
- `docs/FIX_REPORT.md`

`SUBMISSION_COPY.md` must contain ready-to-paste values for:

- GitHub repository URL placeholder;
- deployed demo URL placeholder;
- Architecture & Decisions paragraph;
- model/cost disclosure;
- known limitations.

`DEMO_SCRIPT.md` must be 3–6 minutes and show, in order:

1. grounded answer;
2. memory follow-up;
3. explicit unknown;
4. duplicate-charge escalation;
5. exact agent packet;
6. all four lifecycle messages;
7. endpoint curl;
8. disclosure and limitations.

# Definition of done

Do not report completion until:

- all four chat scenarios work in a clean browser;
- the handoff carries transcript and summary;
- all four journeys trigger and render final copy;
- `/api/answer` works with curl;
- real/preview/deterministic behavior is clearly labeled;
- no prominent enabled control silently does nothing;
- no unresolved email placeholders remain;
- tests, lint, typecheck, and production build pass;
- the public URL works in incognito;
- documentation matches actual behavior.

Run the repository equivalents of:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If a browser test script exists, run it too.

At the end, return:

1. exact requirements satisfied;
2. files changed;
3. commands and results;
4. deployed-mode requirements/secrets;
5. remaining honest limitations;
6. paths to `FINAL_CHECKLIST.md`, `DEMO_SCRIPT.md`, `SUBMISSION_COPY.md`, and `FIX_REPORT.md`.

Call the result a working fellowship prototype, not production-ready software.
