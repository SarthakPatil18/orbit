import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeTempStore } from "./helpers";
import { DEMO_ORG_ID } from "@/lib/constants";
import { retrieveEvidence, RETRIEVAL_THRESHOLD } from "@/lib/services/retrieval";

describe("retrieval", () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await makeTempStore();
    cleanup = ctx.cleanup;
  });

  afterAll(async () => cleanup());

  it("selects the dedicated export source for a paid export question", async () => {
    const store = await (await import("@/lib/store")).getStore();
    const result = await retrieveEvidence(
      store,
      DEMO_ORG_ID,
      "How do I export only paid attendees?",
    );
    expect(result.topScore).toBeGreaterThanOrEqual(RETRIEVAL_THRESHOLD);
    expect(result.candidates[0]?.sourceSlug).toBe("kb-attendee-export");
    expect(result.candidates[0]?.matchedTerms).toContain("export");
  });

  it("flags the retired SMS source as stale", async () => {
    const store = await (await import("@/lib/store")).getStore();
    const result = await retrieveEvidence(
      store,
      DEMO_ORG_ID,
      "Can Orbit send SMS reminders to attendees?",
    );
    const sms = result.candidates.find(
      (c) => c.sourceSlug === "sms-reminders-2023-pilot",
    );
    expect(sms?.stale).toBe(true);
  });

  it("keeps the superseded refund policy in a conflict group without treating it as active", async () => {
    const store = await (await import("@/lib/store")).getStore();
    const sources = await store.listSources(DEMO_ORG_ID);
    const current = sources.find((s) => s.slug === "event-payments-and-refunds");
    const legacy = sources.find((s) => s.slug === "refund-policy-2024-pilot");
    expect(current?.conflictGroup).toBe("refunds");
    expect(legacy?.conflictGroup).toBe("refunds");
    expect(legacy?.status).toBe("archived");

    const result = await retrieveEvidence(
      store,
      DEMO_ORG_ID,
      "Can volunteers issue refunds?",
    );
    expect(result.candidates[0]?.sourceSlug).toBe("event-payments-and-refunds");
  });
});