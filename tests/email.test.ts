import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeTempStore } from "./helpers";
import { DEMO_ORG_ID } from "@/lib/constants";
import { renderLifecycleEmail, canSendTo } from "@/lib/services/email";
import { getStore } from "@/lib/store";

describe("email rendering and allowlist", () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await makeTempStore();
    cleanup = ctx.cleanup;
  });

  afterAll(async () => cleanup());

  it("renders all merge fields without leftover placeholders", async () => {
    const store = await getStore();
    const org = await store.getOrganization(DEMO_ORG_ID);
    const customers = await store.listCustomers(DEMO_ORG_ID);
    const journeys = await store.listJourneys(DEMO_ORG_ID);
    expect(org).toBeTruthy();
    const customer = customers[0]!;
    const journey = journeys.find((j) => j.key === "welcome")!;
    const rendered = await renderLifecycleEmail({
      journey,
      customer,
      organization: org!,
      appUrl: "http://localhost:3000",
    });
    expect(rendered.subject).not.toMatch(/\{\{/);
    expect(rendered.preheader).not.toMatch(/\{\{/);
    expect(rendered.html).not.toMatch(/\{\{/);
    expect(rendered.text).not.toMatch(/\{\{/);
    expect(rendered.mergeFields.primary_action_url).toContain("utm_campaign");
  });

  it("blocks non-allowlisted recipients outside demo mode", () => {
    const previousDemo = process.env.DEMO_MODE;
    const previousKey = process.env.RESEND_API_KEY;
    const previousTo = process.env.DEMO_EMAIL_TO;
    process.env.DEMO_MODE = "false";
    process.env.RESEND_API_KEY = "test-key";
    process.env.DEMO_EMAIL_TO = "allowed@example.com";
    try {
      const allowed = canSendTo("allowed@example.com");
      const blocked = canSendTo("other@example.com");
      expect(allowed.allowed).toBe(true);
      expect(blocked.allowed).toBe(false);
      expect(blocked.reason).toContain("allowlist");
    } finally {
      process.env.DEMO_MODE = previousDemo;
      process.env.RESEND_API_KEY = previousKey;
      process.env.DEMO_EMAIL_TO = previousTo;
    }
  });
});