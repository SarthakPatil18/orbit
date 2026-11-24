# Demo script

About five minutes. Stay on the running demo. Say it is a fellowship prototype. Do not claim a refund was sent or an email left the machine.

## 1. Grounded answer (0:00)

Open `/`. Open ProofDesk. Ask:

```text
How do I export only paid attendees?
```

Point at the steps: Events → the event → Attendees → Export, Payment status **Paid**, Export CSV. Open the source: **Exporting attendees**, `kb-attendee-export`, v2.4, updated 2026-10-18, and the Paid excerpt. One source. The label says **Deterministic demo**.

## 2. Memory (0:40)

Start a new conversation. Ask:

```text
How do I export everyone registered for our hackathon?
```

Then:

```text
Only those who paid, though.
```

The second turn stays in the same thread, still cites `kb-attendee-export`, and explains the Paid filter, including that pending, refunded, and complimentary registrations stay out. Refresh the page and reopen the chat: the thread is still there.

Both turns use the same approved export answer. Say that. The follow-up is context, not a second product feature.

## 3. Explicit unknown (1:30)

New conversation:

```text
Can Orbit reserve our auditorium?
```

Read the refusal: no approved source, no invented booking, and an offer to bring in a person. The badge says **Explicit unknown**. No source card.

## 4. Duplicate charge (2:00)

New conversation:

```text
I was charged twice for one ticket.
```

The reply stops, names Billing, and says no refund was promised or executed. It says the transcript transfers. If the clock is outside weekdays 09:00–18:00 IST, the same handoff says the desk is offline and the transcript still waits.

## 5. Agent packet (2:40)

Open **Open this conversation on the agent desk**. The URL is `/desk?conversation=…` for that thread. In the handoff tab, show:

- customer goal: the duplicate-charge sentence
- summary
- full transcript
- reason: payment exception requires billing verification
- risk: high
- sources consulted
- actions already attempted, including that nothing was refunded
- missing payment references
- recommended next action

## 6. Four emails (3:20)

Open `/journeys`. For Welcome, Inactivity nudge, Feature update, and Offboarding, click **Test journey**. For each, show the trigger, condition, timing, and entry limit, then the preview:

| Journey | Trigger | What you should see |
| --- | --- | --- |
| Welcome | `user.created` | Subject like “Your club has a new home, Reviewer”. Result `previewed`. |
| Inactivity nudge | `user.inactive` | Draft “Design Summit draft”, after 7+ days. Subject “That event draft is getting stage fright”. `previewed`. |
| Feature update | `feature.released` | Upcoming event, release `offline-checkin-v1`. Subject “The door works offline now”. `previewed`. |
| Offboarding | `subscription.cancelled` | Subject “Pro ends on … — your events stay yours”. `previewed`. |

Switch HTML, mobile, and plain text. No `{{placeholders}}`. Say preview is not sent. A repeat feature test for the same club and release is `suppressed`.

## 7. Endpoint (4:30)

```bash
curl -sS -X POST "$DEMO_URL/api/answer" \
  -H 'Content-Type: application/json' \
  -d '{"question":"How do I export only paid attendees?"}'
```

Use the deployed origin for `$DEMO_URL`. Until that exists, `http://127.0.0.1:3000` is the command that was actually run. Point at `answer`, `decision`, `sources[0].key` = `kb-attendee-export`, `escalate`, `conversationId`, `model`, `mode` = `deterministic-demo`, `latencyMs`, `estimatedCostUsd` = `0`, and `traceId`.

## 8. Disclosure (5:00)

Open `/trust#disclosure`. Read the six points: model not called, deterministic fallback, preview email at $0, no vendor price fetched on 24 November 2026, file store and in-memory limiter break first, no login. Mention `GET /api/health`. Stop. Do not imply production tenancy, real payments, or a live model.
