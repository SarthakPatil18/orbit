import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeTempStore } from "../temp-store";
import { DEMO_ORG_ID } from "@/lib/constants";
import { processLifecycleEvent } from "@/lib/email/lifecycle";

describe("lifecycle engine", () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await makeTempStore();
    cleanup = ctx.cleanup;
  });

  afterAll(async () => cleanup());

  it("enrolls a welcome journey and dedupes the second event", async () => {
    const store = await (await import("@/lib/database")).getStore();
    const customers = await store.listCustomers(DEMO_ORG_ID);
    const customer = customers[0]!;
    const first = await processLifecycleEvent(store, DEMO_ORG_ID, {
      type: "user.created",
      customerId: customer.id,
      payload: { workspaceOwner: true },
    });
    expect(first.outcomes.length).toBeGreaterThan(0);
    const enrolled = first.outcomes.find((o) => o.status === "enrolled");
    expect(enrolled).toBeTruthy();
    expect(enrolled?.deliveryId).toBeTruthy();

    const second = await processLifecycleEvent(store, DEMO_ORG_ID, {
      type: "user.created",
      customerId: customer.id,
      payload: { workspaceOwner: true },
    });
    const suppressed = second.outcomes.find((o) => o.status === "suppressed");
    expect(suppressed).toBeTruthy();
  });
});