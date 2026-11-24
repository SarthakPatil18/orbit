# ProofDesk UI & Functionality Audit

**Audit date:** 23 November 2026  
**Target:** current `/home/user/workspace/proofdesk` application  
**Method:** source review, test/lint/build verification, API probes, Chromium desktop/mobile inspection, and critical-path interaction testing

## Executive finding

The website is **not fundamentally broken**. Its visual system is strong and the core support demo works. The real problem is that it currently behaves like a polished prototype rather than a complete application:

- several prominent controls do nothing;
- important state exists only in React/browser memory and disappears after refresh;
- the Trust Center presents static results while its “Run suite” control does nothing;
- lifecycle executions and agent replies are not durable;
- parts of the console use text and touch targets that are too small.

The correct fix is **not a redesign or rewrite**. Preserve the current UI, add persistence and real action handlers, remove or clearly disable nonessential controls, and add browser tests for every reviewer-facing flow.

---

## Verification results

```text
Unit/integration tests: 28 passed
Lint:                  passed
Production build:      passed
Runtime console errors: 0
Failed browser requests: 0
Desktop horizontal overflow: none
390 × 844 overflow: none
POST /api/answer invalid input: 400
POST /api/answer oversized input: 400
GET /api/health: 200
```

Health response correctly disclosed:

```json
{
  "modelMode": "deterministic-demo",
  "emailMode": "preview-sink"
}
```

### Working paths confirmed

- Orbit landing page renders correctly.
- Customer chat opens on desktop and mobile.
- Paid-attendee export returns a grounded answer.
- Unsupported and escalation policy tests pass.
- Duplicate-charge chat produces a dynamic handoff.
- Opening the agent-side packet selects the exact demo visitor conversation.
- Lifecycle `Test journey` calls the API and produces a preview-sink success state.
- Chat fills the full 390 × 844 viewport correctly.

---

# Findings by severity

## P0 — submission-blocking functionality

### P0.1 Agent actions are not durable

**Observed:** An agent reply appears immediately, but disappears after page reload.

**Reproduction:**

1. Trigger duplicate-charge escalation from the customer widget.
2. Open the agent packet.
3. Send: `I have verified your payment and will continue from here.`
4. Reload `/desk`.
5. The reply is gone.

**Cause:** The desk copies seeded/browser chat state into local React state. Replies, ownership, resolution, and status changes are not persisted through an API or database.

**Required fix:** Persist conversations, messages, handoffs, assignment, and status. After refresh and in a second browser context, the same conversation must still exist.

### P0.2 Dynamic handoff is same-browser only

**Observed:** Customer → agent handoff works only because `/desk` reads the customer widget’s localStorage in the same browser.

**Risk:** A deployed reviewer who opens the console in another tab/device/session will not see a real shared queue.

**Required fix:** On escalation, `POST /api/answer` or a handoff endpoint must persist the conversation and packet server-side. `/desk` must read from that persisted repository.

### P0.3 Lifecycle run history disappears

**Observed:** `Test journey` succeeds and displays a delivery record. Reloading `/journeys` removes the record.

**Required fix:** Persist customer events, journey runs, enrollment/suppression reason, and delivery records. Reload must preserve history.

### P0.4 Trust Center action is fake

**Observed:** Clicking **Run suite** causes no request and no DOM/state change. Displayed 20/20 results and latencies are static fixtures.

**Risk:** This conflicts with the project’s trust and full-disclosure positioning.

**Required fix:** Implement a real evaluation API, execute the existing golden cases, persist a run, and render actual decisions, sources, timing, and pass/fail results. Until implemented, remove or disable the Run/Compare controls and label fixtures clearly.

### P0.5 Prominent no-op actions

The following visible controls produced no action or are currently decorative:

- Home: **Sign in**
- Home: **Create your first event**
- Home: **Manage event**
- Desk: **New conversation**
- Desk: global **Search**
- Journeys: **New journey** / add journey
- Journeys: **View definition**
- Trust: **Run suite** / **Compare run**
- Knowledge: **Import** / **New source**

**Required fix:** Implement actions needed for the fellowship flow. For nonessential product-demo actions, either remove them, link them to a clear demo state, or visibly disable them with an honest “Demo product” explanation. No prominent enabled button should silently do nothing.

---

## P1 — credibility and data-quality problems

### P1.1 Evidence is over-inclusive

**Observed:** “How do I export only paid attendees?” returns the correct answer but says it checked **three approved sources**. The export article should normally be sufficient.

**Risk:** Extra weak sources reduce evidence credibility and make the system look like a keyword wrapper.

**Required fix:** Return only sources above a calibrated threshold and/or within a score delta of the top source. Add a regression assertion that the paid-export scenario cites `kb-attendee-export` as the primary source and excludes unrelated sources.

### P1.2 No durable knowledge operations

Knowledge search and article selection work, but import/create/edit/archive/re-index are not implemented.

**Recommended scope:** For the fellowship, implement create/edit/archive and re-index for approved sources. Arbitrary web crawling is unnecessary.

### P1.3 Static evaluation metrics

The Trust Center’s decision accuracy and latency look measured but are fixture values.

**Required fix:** Derive metrics from stored evaluation runs. Explicitly label deterministic demo measurements and sample size.

### P1.4 No end-to-end browser tests in the repository

The existing 28 tests cover the support engine and email rendering but not the real UI flow.

**Required fix:** Add Playwright tests for grounded answer, abstention, dynamic handoff, agent reply persistence, journey persistence, real evaluation run, and mobile chat.

### P1.5 No application-level rate limiting or authentication

Input validation works, but public endpoints do not currently have rate limits. The agent console has no access control.

**Deadline-aware fix:** Add basic server-side rate limiting and a clearly documented demo-agent access mechanism. Full organization auth is a stretch goal, not a reason to delay the core demo.

---

## P2 — UI and accessibility quality

### P2.1 Console text is too small

Several console styles use approximately 0.43–0.68 rem text. Important labels, timestamps, evidence metadata, and actions become difficult to read at 1440 px.

**Fix:** Use at least 12 px for secondary operational text, 13–14 px for actionable labels, and 14–16 px for message content. Retain monospace styling without sacrificing readability.

### P2.2 Missing accessible labels

Observed unlabeled icon-only controls include:

- one customer-context ellipsis control in Desk;
- desktop/mobile device-toggle controls in Journeys.

**Fix:** Add accurate `aria-label`, visible focus, and at least 40–44 px mobile hit areas.

### P2.3 Navigation controls appear interactive but are not

The collapse-navigation control and some Help/More controls have no completed behavior.

**Fix:** Implement them or remove/disable them. Avoid controls whose only function is visual realism.

### P2.4 Mobile chat has cramped status copy

The header’s “AI first · humans close by” line is visually cramped. Bottom close/protection controls are also extremely small.

**Fix:** Increase spacing and minimum touch-target size. Keep the strong full-height mobile-chat behavior.

---

# What should remain unchanged

The following are already strong and should not be redesigned:

- forest/ink/lime visual identity;
- Orbit landing-page structure;
- product mockup and editorial typography;
- customer chat composition;
- three-panel agent information architecture;
- handoff packet ordering;
- lifecycle event → condition → message → exit visual model;
- explicit limitations panel;
- deterministic answer/clarify/abstain/escalate policy.

The fix should prioritize behavior, persistence, readability, and honest states—not another visual rebuild.

---

# Deadline-priority repair order

## Phase 1 — make the reviewer path real

1. Add durable repository/storage.
2. Persist customer messages and handoffs.
3. Load the same conversation in `/desk`.
4. Persist agent replies, assignment, and resolution.
5. Persist events, journey runs, and preview deliveries.
6. Implement actual Trust Center execution.

## Phase 2 — remove prototype traps

1. Audit every visible button/link.
2. Implement essential controls.
3. Remove or explicitly disable nonessential controls.
4. Calibrate evidence-source filtering.
5. Add meaningful error/loading/empty states.

## Phase 3 — polish and prove

1. Raise console type sizes.
2. Add missing labels and touch targets.
3. Add Playwright critical-path tests.
4. Test in a clean browser and a second session.
5. Re-run lint, typecheck, tests, and production build.

---

# Acceptance checks after repair

- A customer conversation survives reload.
- A handoff created in one browser context appears in the agent queue fetched from the server.
- An agent reply and resolution survive reload.
- A journey run and its preview delivery survive reload.
- Run Suite sends a request, executes cases, persists the run, and updates metrics.
- Paid-attendee export shows the correct primary source without unrelated evidence.
- Every visible enabled control has a demonstrable outcome.
- All icon-only controls have accessible names.
- No essential console text is below 12 px.
- Desktop and 390 × 844 critical paths pass.
- Tests, lint, typecheck, and production build pass.
