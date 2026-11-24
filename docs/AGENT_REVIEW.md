# Agent Review — ProofDesk / Orbit Audit & Repair Plan

**Reviewer:** Antigravity Autonomous Agent  
**Date:** 23 November 2026  
**Repository:** `/Users/sarthak/Desktop/arc` (ProofDesk / Orbit)  
**Track:** YARC Builder Fellowship Track 05 — Support  
**Baseline Verification:** 18 unit/integration tests passing; dev server active on port 3000; 3 TypeScript/ESLint errors preventing build.

---

## 1. Executive Summary

This independent review confirms the primary diagnosis of `UI_FUNCTIONALITY_AUDIT.md`: ProofDesk possesses a mature visual identity (Orbit's forest/ink/lime design language, three-panel agent desk, event-driven lifecycle studio, and evidence-conditioned support engine), but was left in an intermediate state with a broken build and missing end-to-end browser assertions.

Specifically:
- The server-side persistence layer (`FileStore` and `PostgresStore`) and backend endpoints (`/api/answer`, `/api/conversations/[id]/actions`, `/api/events`, `/api/evaluations/run`, `/api/knowledge`) are largely built and functioning.
- However, TypeScript type errors (`serverNow` prop mismatch, `relativeTime` argument mismatch) and ESLint unused variable errors block `npm run typecheck`, `npm run lint`, and `npm run build`.
- In `src/components/desk/desk-workspace.tsx`, while server refresh exists on action triggers and via manual button click, a background polling/visibility refresh is required to ensure that an escalation created in Browser Context A immediately appears in Browser Context B without manual intervention.
- The Playwright test suite (`e2e/critical.spec.ts`) covers 5 baseline flows; it must be expanded to cover all 9 required scenarios specified in `OPENCODE_REPAIR_PROMPT.md`.

---

## 2. Confirmed Audit Findings

| Audit ID | Finding | Status | Verification & Evidence |
|---|---|---|---|
| **P0.1** | Agent actions must be durable | **Confirmed** | Backend endpoint `POST /api/conversations/[id]/actions` is implemented and updates the store. Client needed reliable reload and state hydration verification. |
| **P0.2** | Customer → agent handoff must be cross-browser | **Confirmed** | `POST /api/answer` creates a server-side conversation, messages, citations, and handoff in the store. `/desk` queries the server store on load, but lacked automatic periodic polling so another browser tab updates live. |
| **P0.3** | Lifecycle run and delivery history must survive reload | **Confirmed** | `POST /api/events` and `/api/deliveries` persist lifecycle runs and preview sink deliveries to the store. Reloading `/journeys` reads directly from the store. |
| **P0.4** | Trust Center must run real 20-case golden suite | **Confirmed** | `POST /api/evaluations/run` executes all 20 golden cases via `runEvaluationSuite()`, checks all deterministic gates, and writes `EvalRun` and `EvalResult` entities to the store. |
| **P0.5** | Prominent no-op controls | **Confirmed** | Decorative landing page buttons ("Sign in", "Create your first event") were removed or linked to real routes. Remaining buttons in Desk, Journeys, Trust, and Knowledge have active handlers. |
| **P1.1** | Evidence over-inclusiveness | **Confirmed** | Lexical retrieval in `src/lib/services/retrieval.ts` returned up to `limit` candidates without filtering by `score >= threshold` and top score delta. Calibrating candidate selection ensures only relevant evidence is attached. |
| **P1.2** | Knowledge operations | **Confirmed** | `KnowledgeWorkspace` has modal form for create/edit, reindex endpoint `/api/knowledge/[id]/reindex`, and interactive playground `/api/knowledge/playground`. |
| **P1.3** | Derived evaluation metrics | **Confirmed** | `TrustWorkspace` calculates metrics directly from stored `EvalRun` and `EvalResult` objects; no hard-coded stats remain. |
| **P1.4** | Missing comprehensive E2E tests | **Confirmed** | Existing `e2e/critical.spec.ts` only tested 5 paths; must cover all 9 scenarios including Context A -> Context B handoff, reload survival, and 390x844 mobile viewport. |
| **P1.5** | Rate limiting & security safeguards | **Confirmed** | In-memory token bucket rate limiting in `src/lib/api/rate-limit.ts` and Zod schema validation in `src/lib/api/validation.ts` protect all public mutation endpoints. |
| **P2.1–P2.4** | Console readability & accessibility | **Confirmed** | UI text sizes verified; `aria-label` tags present on icon buttons (`Search conversations`, `Refresh conversation list`, `Close preview`, etc.); touch targets are >= 40px. |

---

## 3. Disagreements and Clarifications

### 3.1 SQLite/libSQL vs. Existing Architecture
- **Audit/Prompt Note:** "If none exists, use libSQL/Turso with Drizzle..."
- **Review Finding:** The codebase already contains an idiomatic dual-storage abstraction:
  1. `FileStore` (`src/lib/store/file-store.ts`): Durable atomic JSON storage in `.data/proofdesk.json` with write queue serialization. It runs out of the box with zero external dependencies (no Docker or remote credentials needed for development/demo).
  2. `PostgresStore` (`src/lib/store/postgres-store.ts`): Full Drizzle ORM schema (`src/lib/db/schema.ts`), PostgreSQL driver (`postgres`), and migrations (`scripts/migrate.ts`).
  Swapping to libSQL/Turso would require rewriting tested repository adapters and migrations without functional gain. We preserve the existing file + PostgreSQL dual adapter.

### 3.2 Fictional Marketing CTA Buttons
- **Audit Finding P0.5:** Home page "Sign in", "Create your first event", "Manage event" were flagged as dead controls.
- **Review Finding:** The landing page (`src/app/page.tsx`) already eliminated dead product buttons. The hero CTAs are "Open the support desk" (`/desk`) and "See the Trust Center" (`/trust`). The event console mockup is clearly presented as an illustrative product dashboard without fake interactive traps.

---

## 4. Additional Discovered Bugs

1. **TypeScript Typecheck Failure in `src/app/desk/page.tsx` (Line 112):**
   - `<DeskWorkspace />` was invoked without providing `serverNow`, which was declared as a required prop in `src/components/desk/desk-workspace.tsx` (Line 126).
2. **TypeScript Argument Mismatch in `src/components/desk/desk-workspace.tsx` (Lines 401 & 1115):**
   - Helper function `relativeTime(value: string, now: number)` required 2 arguments, but was invoked as `relativeTime(row.lastMessageAt)` and `relativeTime(conversation?.createdAt ?? ...)`.
3. **ESLint Unused Variables in `src/components/desk/desk-workspace.tsx` (Line 130):**
   - `const [now, setNow] = useState(serverNow);` resulted in unused variable warnings/errors for `now` and `setNow`.
4. **Missing Automatic Queue Polling in `/desk`:**
   - In `DeskWorkspace`, `refreshList` was only called on user actions and manual click of the refresh button. For true cross-browser handoff observation (Browser Context B viewing incoming handoffs from Browser Context A), a lightweight polling interval (every 4 seconds) or window focus listener is necessary.

---

## 5. Root Cause Analysis for P0/P1 Issues

### P0.1 & P0.2 (Agent Actions & Cross-Browser Handoff)
- **Root Cause:** Early prototypes stored customer conversations in browser `sessionStorage` / `localStorage`, and the agent desk maintained in-memory mock state. While the backend store was added, the desk client did not poll the server automatically, causing cross-context sync to require a manual page reload.
- **Resolution:** `POST /api/answer` writes conversations, messages, citations, and handoffs directly to `store`. Add background polling (`setInterval(refreshList, 4000)`) in `DeskWorkspace` and pass server timestamps properly.

### P0.3 (Lifecycle Execution Durability)
- **Root Cause:** Earlier lifecycle simulator only kept delivery records in component state.
- **Resolution:** `POST /api/events` already writes `CustomerEvent`, `JourneyRun`, and `Delivery` records to `store`. Server-rendered `/journeys` reads initial deliveries from `store.listDeliveries(org)`.

### P0.4 (Trust Center Reality)
- **Root Cause:** Trust Center initially displayed hardcoded 20/20 fixture arrays and latencies.
- **Resolution:** `POST /api/evaluations/run` executes `runEvaluationSuite()` against all 20 cases in `src/lib/seed/cases.ts`, verifies policy decisions, citations, and risk categories, stores the `EvalRun` and `EvalResult` records, and updates metrics derived strictly from results.

### P1.1 (Evidence Precision)
- **Root Cause:** `retrieveEvidence` ranked chunks by score but pushed up to `limit` candidates into `selected` without filtering out low-scoring candidates or chunks falling far below the top candidate's score.
- **Resolution:** Enforce that candidates must meet `score >= threshold` and fall within a calibrated score delta (e.g. `topScore - score <= 0.15`), and return empty sources when the engine abstains.

---

## 6. Exact Repair Plan & Affected Files

1. **`src/app/desk/page.tsx` & `src/components/desk/desk-workspace.tsx`**:
   - Provide `serverNow={Date.now()}` in `src/app/desk/page.tsx`.
   - In `desk-workspace.tsx`, make `serverNow?: number` optional with default fallback `Date.now()`.
   - Update `relativeTime(value: string, now: number = Date.now())` to have a default parameter and pass `now` at call sites.
   - Clean up `now`/`setNow` declaration to resolve ESLint errors.
   - Add a 4-second polling effect in `desk-workspace.tsx` for real-time cross-browser handoff detection.
2. **`src/lib/services/retrieval.ts`**:
   - Calibrate candidate selection in `retrieveEvidence` to exclude candidates below threshold or far below the primary source.
3. **`e2e/critical.spec.ts`**:
   - Add all 9 critical scenarios:
     1. Grounded paid-attendee answer with precise evidence.
     2. Unsupported auditorium request abstains without weak sources.
     3. Cross-browser handoff (Context A escalates, Context B at `/desk` receives handoff).
     4. Agent reply and resolution survive page reload.
     5. Lifecycle run and delivery preview survive reload.
     6. Trust Center runs evaluation suite, updates metrics, and persists run.
     7. Reviewer-facing controls produce observable outcomes.
     8. Mobile chat fits 390 × 844 viewport and remains keyboard/touch usable.
     9. Zero console errors or failed first-party requests across all routes.
4. **Verification**:
   - Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run build`.
5. **Documentation**:
   - Produce `docs/FIX_REPORT.md` and update `README.md`.
