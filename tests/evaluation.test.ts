import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeTempStore } from "./helpers";
import { DEMO_ORG_ID } from "@/lib/constants";
import { runEvaluationSuite } from "@/lib/services/evaluation";
import { releaseGates } from "@/lib/evaluation-gates";

describe("evaluation suite", () => {
  let store: Awaited<ReturnType<typeof makeTempStore>>["store"];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await makeTempStore();
    store = ctx.store;
    cleanup = ctx.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  it("runs all 20 seeded cases with real metrics", async () => {
    const cases = await store.listEvalCases(DEMO_ORG_ID);
    expect(cases).toHaveLength(20);

    const { run, results } = await runEvaluationSuite({
      store,
      orgId: DEMO_ORG_ID,
      label: "test run",
      release: "test",
    });

    expect(results).toHaveLength(20);
    expect(run.status).toBe("completed");
    expect(run.total).toBe(20);
    expect(run.metrics.decisionAccuracy).toBe(1);
    expect(run.metrics.sourceSelectionAccuracy).toBe(1);
    expect(run.metrics.unsupportedAbstainRate).toBe(1);
    expect(run.metrics.escalationRecall).toBe(1);
    expect(run.metrics.unnecessaryEscalationRate).toBe(0);
    expect(run.metrics.citationCoverage).toBe(1);

    const gates = releaseGates(run.metrics);
    expect(gates.every((g) => g.passed)).toBe(true);
  });

  it("stores traces and expected decisions", async () => {
    const runs = await store.listEvalRuns(DEMO_ORG_ID);
    expect(runs.length).toBeGreaterThan(0);
    const results = await store.listEvalResults(DEMO_ORG_ID, runs[0]!.id);
    expect(results).toHaveLength(20);
    for (const r of results) {
      expect(r.trace).toBeTruthy();
      expect(Array.isArray(r.failures)).toBe(true);
    }
  });
});