# Final checklist

Checked on 24 November 2026 against the local production server at `http://127.0.0.1:3000` (`DEMO_MODE=true`, file store). This is a working fellowship prototype, not production software.

| Check | Result |
| --- | --- |
| Grounded answer for “How do I export only paid attendees?” | Pass. Specific Paid-filter steps. Primary source `kb-attendee-export`, title “Exporting attendees”, v2.4, updated 2026-10-18, Paid excerpt. One source. |
| Memory: export question, then “Only those who paid, though.” | Pass. Same conversation. Second turn stays on `kb-attendee-export` and explains the Paid filter. Thread survives refresh via `sessionStorage` (`proofdesk.widget.v1`) and the server conversation. |
| “Can Orbit reserve our auditorium?” | Pass. Explicit unknown. No source. Offers a person. Does not invent a reservation. |
| “I was charged twice for one ticket.” | Pass. Routes to Billing. No refund promised or executed. Customer is told the transcript transfers. Desk opens that conversation. |
| Visible states: checking sources, provider unavailable, offline hours, explicit unknown, escalation, retry | Pass in the widget. Provider-unavailable and offline hours are conditional. On 24 November 2026 during weekday 09:00–18:00 IST the desk label was online. Offline copy is covered by `supportWindowStatus` unit tests. |
| Routing triggers and packet fields | Pass. Explicit person, payment/refund, security, privacy/deletion, frustration, two failures, and prompt/policy bypass escalate. The Billing packet showed goal, summary, full transcript, reason, risk, sources consulted, actions, missing information, and next action. |
| Four journeys | Pass in the browser. Welcome `user.created`, inactivity `user.inactive` (8 days, draft present), feature `feature.released` (`offline-checkin-v1`, upcoming event), offboarding `subscription.cancelled`. Each showed trigger, condition, timing, exit/limit, final subject and body, HTML/mobile/plain preview, and `previewed`. No `{{placeholders}}`. |
| `POST /api/answer` | Pass locally. See the curl in `README.md` and `docs/FIX_REPORT.md`. |
| Disclosure on `/trust#disclosure` and in the README | Pass. Model, fallback, preview email, cost date, what breaks first, persistence, and security match the running demo. |
| Routes `/`, `/desk`, `/journeys`, `/knowledge`, `/trust`, `/api/health`, `/api/answer` | Pass. |
| Trust “Run the 20-case suite” | Pass in Playwright. The button runs the real golden cases and persisted 20/20. The production store had no run until that button is used; the page says so. |
| No unresolved email placeholders | Pass on the four tested renders. |
| Lint, typecheck, unit tests, Playwright, production build | Pass. Counts are in `docs/FIX_REPORT.md`. |
| 390×844 chat and no console errors or failed first-party requests | Pass in Playwright, desktop Chromium and Pixel 7. |
| Public URL in a clean incognito window | Not met. No deployment exists. Do not paste a URL until one is live. |

## Known behavior to say out loud

The approved export article has one composed answer. “How do I export everyone registered for our hackathon?” and the Paid follow-up both return the Paid-filter procedure from `kb-attendee-export`. The follow-up keeps the conversation and shows the Paid excerpt. It does not invent a second export mode.

Feature-update tests use a unique club per sample customer. A second test for the same club and `offline-checkin-v1` is `suppressed` (“Once per workspace per release version”). That is the real rule.

Demo email is `previewed`, never `sent`.
