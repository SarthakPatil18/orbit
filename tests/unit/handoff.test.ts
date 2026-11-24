import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeTempStore } from "../temp-store";
import { DEMO_ORG_ID } from "@/lib/constants";
import { answerQuestion } from "@/lib/ai/answer";

describe("handoff creation", () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await makeTempStore();
    cleanup = ctx.cleanup;
  });

  afterAll(async () => cleanup());

  it("creates a pending handoff with required packet fields on escalation", async () => {
    const store = await (await import("@/lib/database")).getStore();
    const customers = await store.listCustomers(DEMO_ORG_ID);
    const customer = customers[0]!;
    const result = await answerQuestion({
      store,
      orgId: DEMO_ORG_ID,
      question: "I was charged twice for my ticket.",
      customerId: customer.id,
      useModel: false,
    });
    expect(result.decision).toBe("escalate");
    expect(result.handoffPreview).toBeTruthy();
    const handoffs = await store.listHandoffs(DEMO_ORG_ID);
    const handoff = handoffs.find((h) => h.customerGoal.toLowerCase().includes("charged twice"))!;
    expect(handoff.status).toBe("pending_confirmation");
    expect(handoff.customerGoal).toBeTruthy();
    expect(handoff.summary).toBeTruthy();
    expect(handoff.escalationReason).toBeTruthy();
    expect(handoff.recommendedNextAction).toBeTruthy();
    expect(handoff.fullTranscript.length).toBeGreaterThan(0);
    expect(handoff.sourcesConsulted).toBeDefined();
  });
});