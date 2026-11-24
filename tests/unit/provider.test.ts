import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeTempStore } from "../temp-store";
import { DEMO_ORG_ID } from "@/lib/constants";
import { answerQuestion } from "@/lib/ai/answer";

describe("provider fallback", () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await makeTempStore();
    cleanup = ctx.cleanup;
  });

  afterAll(async () => cleanup());

  it("uses deterministic generation in demo mode", async () => {
    const store = await (await import("@/lib/database")).getStore();
    const customers = await store.listCustomers(DEMO_ORG_ID);
    const customer = customers[0]!;
    const result = await answerQuestion({
      store,
      orgId: DEMO_ORG_ID,
      question: "How do I export only paid attendees?",
      customerId: customer.id,
      useModel: true,
    });
    expect(result.model).toContain("deterministic");
    expect(result.decision).toBe("answer");
  });
});