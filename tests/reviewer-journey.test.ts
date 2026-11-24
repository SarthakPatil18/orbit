import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeTempStore } from "./helpers";
import { DEMO_ORG_ID } from "@/lib/constants";
import { answerQuestion, supportWindowStatus } from "@/lib/services/answer";
import { testJourney } from "@/lib/services/lifecycle";
import { getStore } from "@/lib/store";

describe("reviewer journey", () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await makeTempStore();
    cleanup = ctx.cleanup;
  });

  afterAll(async () => cleanup());

  it("answers the paid export from kb-attendee-export only", async () => {
    const store = await getStore();
    const response = await answerQuestion({
      store,
      question: "How do I export only paid attendees?",
    });
    expect(response.decision).toBe("answer");
    expect(response.escalate).toBe(false);
    expect(response.sources).toHaveLength(1);
    expect(response.sources[0]?.key).toBe("kb-attendee-export");
    expect(response.sources[0]?.title).toBe("Exporting attendees");
    expect(response.sources[0]?.version).toBe("2.4");
    expect(response.sources[0]?.effectiveDate).toBe("2026-10-18");
    expect(response.sources[0]?.excerpt.length).toBeGreaterThan(40);
    expect(response.answer).toMatch(/Paid/);
    expect(response.answer).not.toMatch(/Capacity, waitlists/);
    expect(response.mode).toBe("deterministic-demo");
    expect(response.estimatedCostUsd).toBe(0);
    expect(response.traceId).toMatch(/^trace_/);
    expect(response.conversationId).toBeTruthy();
    expect(response.latencyMs).toBeGreaterThan(0);
  });

  it("remembers the export conversation on the paid follow-up", async () => {
    const store = await getStore();
    const first = await answerQuestion({
      store,
      question: "How do I export everyone registered for our hackathon?",
    });
    const second = await answerQuestion({
      store,
      question: "Only those who paid, though.",
      conversationId: first.conversationId,
    });
    expect(first.decision).toBe("answer");
    expect(first.sources[0]?.key).toBe("kb-attendee-export");
    expect(second.decision).toBe("answer");
    expect(second.conversationId).toBe(first.conversationId);
    expect(second.sources).toHaveLength(1);
    expect(second.sources[0]?.key).toBe("kb-attendee-export");
    expect(second.answer).toMatch(/Paid/);
    expect(second.answer).toMatch(/pending|refunded|complimentary/i);
  });

  it("abstains on an auditorium request and attaches no source", async () => {
    const store = await getStore();
    const response = await answerQuestion({
      store,
      question: "Can Orbit reserve our auditorium?",
    });
    expect(response.decision).toBe("abstain");
    expect(response.sources).toHaveLength(0);
    expect(response.escalate).toBe(false);
    expect(response.answer).toMatch(/don't know|won't guess|no approved/i);
    expect(response.answer).toMatch(/person/i);
    expect(response.answer).not.toMatch(/I can reserve|auditorium is booked/i);
  });

  it("escalates a duplicate charge with the same transcript", async () => {
    const store = await getStore();
    const question = "I was charged twice for one ticket.";
    const response = await answerQuestion({ store, question });
    expect(response.decision).toBe("escalate");
    expect(response.escalate).toBe(true);
    expect(response.escalationReason).toMatch(/billing verification/i);
    expect(response.sources).toHaveLength(0);
    expect(response.answer).toMatch(/transcript/i);
    expect(response.answer).not.toMatch(/refund has been|I've refunded|refund is on its way/i);
    const handoff = await store.getHandoffByConversation(
      DEMO_ORG_ID,
      response.conversationId,
    );
    expect(handoff).toBeTruthy();
    expect(handoff?.customerGoal).toBe(question);
    expect(handoff?.summary).toMatch(/charged twice/i);
    expect(handoff?.escalationReason).toMatch(/billing verification/i);
    expect(handoff?.actionsAttempted.length).toBeGreaterThan(0);
    expect(handoff?.missingInformation.length).toBeGreaterThan(0);
    expect(handoff?.recommendedNextAction.length).toBeGreaterThan(20);
    expect(
      handoff?.fullTranscript.some(
        (entry) => entry.role === "customer" && entry.content === question,
      ),
    ).toBe(true);
  });

  it("previews all four lifecycle journeys without placeholders", async () => {
    const store = await getStore();
    const journeys = await store.listJourneys(DEMO_ORG_ID);
    const keys = ["welcome", "inactivity-nudge", "offline-checkin", "offboarding"];
    for (const key of keys) {
      const journey = journeys.find((item) => item.key === key);
      expect(journey).toBeTruthy();
      const result = await testJourney(store, DEMO_ORG_ID, journey!.id);
      expect(result.result).toBe("previewed");
      expect(result.subject).toBeTruthy();
      expect(result.text).toBeTruthy();
      expect(result.html).toBeTruthy();
      expect(result.subject).not.toMatch(/\{\{/);
      expect(result.text).not.toMatch(/\{\{/);
      expect(result.html).not.toMatch(/\{\{/);
      expect(result.provider).toBe("demo-sink");
    }
  });

  it("labels human hours from the Asia/Kolkata clock", () => {
    expect(supportWindowStatus(new Date("2026-11-24T04:30:00.000Z"))).toBe(
      "online",
    );
    expect(supportWindowStatus(new Date("2026-11-24T14:30:00.000Z"))).toBe(
      "offline",
    );
    expect(supportWindowStatus(new Date("2026-11-28T06:30:00.000Z"))).toBe(
      "offline",
    );
  });
});
