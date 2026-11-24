import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeTempStore } from "./helpers";
import { setStoreForTests, clearStoreCache } from "@/lib/store";
import { POST as answerPost } from "@/app/api/answer/route";

describe("API validation and rate limiting", () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await makeTempStore();
    setStoreForTests(ctx.store);
    cleanup = ctx.cleanup;
  });

  afterAll(async () => {
    clearStoreCache();
    await cleanup();
  });

  it("rejects malformed answer payloads with 422", async () => {
    const req = new Request("http://localhost:3000/api/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "" }),
    });
    const res = await answerPost(req);
    expect(res.status).toBe(422);
  });

  it("rate limits after repeated requests", async () => {
    // send many requests to trigger limiter
    const statuses: number[] = [];
    for (let i = 0; i < 35; i += 1) {
      const req = new Request("http://localhost:3000/api/answer", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.99" },
        body: JSON.stringify({ question: "How do I export only paid attendees?" }),
      });
      const res = await answerPost(req);
      statuses.push(res.status);
    }
    expect(statuses).toContain(429);
  });
});