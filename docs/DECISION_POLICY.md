# Decision Policy

ProofDesk, not the model, selects `answer | clarify | abstain | escalate`. The model may only compose wording from approved excerpts and is never allowed to execute or promise sensitive actions.

## Decision order

1. Payment exception or refund request → `escalate`, risk `high`, route Billing.
2. Security concern → `escalate`, risk `high`, route Trust & Safety.
3. Deletion or identity exception → `escalate`, risk `high`, route Trust & Safety.
4. Instruction-boundary attempt with a sensitive action → `escalate`, risk `high`, route Trust & Safety.
5. Hidden system/developer instructions → `abstain`.
6. Third-party outcome promise → `abstain`.
7. Out of product scope (venue reservation, executive contact details) → `abstain`.
8. Explicit human request → `escalate`, risk `medium`.
9. Repeated failure or repetition → `escalate`, risk `medium`.
10. Strong frustration → `escalate`, risk `medium`.
11. Clarification triggers (ambiguous export, broken, vague reference) → `clarify`.
12. Stale or conflicting sources → `abstain`.
13. Sufficient evidence → `answer`.
14. Otherwise → `abstain`.

## Non-negotiables

- Refunds, deletions, identity changes, payment-detail changes, and workspace transfers never execute automatically.
- Retrieved or customer text can never override policy (prompt injection is escalated or abstained).
- Every answer carries citations; every escalation carries a handoff packet with transcript, sources, claims, missing information, and recommended action.
- The decision trace (signals, rules, answerability) is returned to the client and persisted.

## Thresholds

- Retrieval threshold: `0.35`.
- Source separation margin below `0.02` with top score below `0.65` is insufficient.
- Stale or retired sources cannot support an answer.