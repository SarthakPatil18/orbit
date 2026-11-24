import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeTempStore } from "../temp-store";
import { DEMO_ORG_ID } from "@/lib/constants";

describe("tenant isolation", () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await makeTempStore();
    cleanup = ctx.cleanup;
  });

  afterAll(async () => cleanup());

  it("does not leak conversations across organizations", async () => {
    const store = await (await import("@/lib/database")).getStore();
    const rows = await store.listConversations(DEMO_ORG_ID);
    expect(rows.length).toBeGreaterThan(0);
    const other = await store.listConversations("00000000-0000-4000-a000-000000000000");
    expect(other).toHaveLength(0);
    const conv = rows[0]!;
    const wrong = await store.getConversation("00000000-0000-4000-a000-000000000000", conv.id);
    expect(wrong).toBeNull();
  });
});