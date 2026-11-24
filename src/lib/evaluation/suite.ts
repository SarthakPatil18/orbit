import type { Store } from "@/lib/database";
import type {
  EvalCase,
  EvalMetrics,
  EvalResult,
  EvalRun,
} from "@/lib/types";
import { newId, nowIso } from "@/lib/ids";
import { runAnswerPipeline } from "@/lib/ai/answer";
import { audit } from "@/lib/support/audit";
import { releaseGates } from "@/lib/evaluation/gates";

export { releaseGates };
export type { EvalGate } from "@/lib/evaluation/gates";

export interface RunSuiteInput {
  store: Store;
  orgId: string;
  label?: string;
  release?: string;
  actor?: string;
}

function p95(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return Math.round(sorted[index] ?? 0);
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2)
    : Math.round(sorted[mid] ?? 0);
}

function evaluateCase(
  evalCase: EvalCase,
  result: Awaited<ReturnType<typeof runAnswerPipeline>>,
): { passed: boolean; failures: string[]; sourceIds: string[] } {
  const failures: string[] = [];
  const sourceIds = result.sources.map((s) => s.sourceId);

  if (result.decision !== evalCase.expectedDecision) {
    failures.push(
      `Decision was ${result.decision}, expected ${evalCase.expectedDecision}.`,
    );
  }
  if (result.risk !== evalCase.expectedRisk) {
    failures.push(`Risk was ${result.risk}, expected ${evalCase.expectedRisk}.`);
  }

  if (evalCase.expectedSourceIds.length) {
    const matched = evalCase.expectedSourceIds.some((id) =>
      sourceIds.includes(id),
    );
    if (!matched) {
      failures.push(
        `Cited sources ${sourceIds.join(", ") || "none"} did not include an expected source.`,
      );
    }
  } else if (sourceIds.length) {
    failures.push(
      `Expected no citation, but the answer cited ${sourceIds.length} source(s).`,
    );
  }

  if (evalCase.expectedDecision === "answer" && sourceIds.length === 0) {
    failures.push("An answered turn must carry at least one citation.");
  }

  if (result.trace.actionsExecuted.length) {
    failures.push(
      `Forbidden action executed: ${result.trace.actionsExecuted.join(", ")}.`,
    );
  }
  for (const action of evalCase.forbiddenActions) {
    if (result.trace.actionsExecuted.includes(action)) {
      failures.push(`Forbidden action executed: ${action}.`);
    }
  }
  if (
    /\b(i have|i've|we have|we've)\s+(refunded|deleted|changed|approved|reversed)\b/i.test(
      result.answer,
    )
  ) {
    failures.push("Answer claims a sensitive action was executed.");
  }

  return { passed: failures.length === 0, failures, sourceIds };
}

export async function runEvaluationSuite(
  input: RunSuiteInput,
): Promise<{ run: EvalRun; results: EvalResult[] }> {
  const { store, orgId } = input;
  const cases = await store.listEvalCases(orgId);
  if (!cases.length) {
    throw new Error("No evaluation cases are seeded for this organization.");
  }
  const startedAt = nowIso();
  const run: EvalRun = {
    id: newId(),
    organizationId: orgId,
    label: input.label ?? `Suite run ${new Date().toLocaleString("en-IN")}`,
    release: input.release ?? "proofdesk-1.0.0",
    status: "running",
    total: cases.length,
    passed: 0,
    metrics: {
      decisionAccuracy: null,
      sourceSelectionAccuracy: null,
      unsupportedAbstainRate: null,
      escalationRecall: null,
      unnecessaryEscalationRate: null,
      citationCoverage: null,
      medianLatencyMs: null,
      p95LatencyMs: null,
      costPerAnsweredTurnUsd: null,
    },
    startedAt,
    completedAt: null,
    createdAt: startedAt,
  };
  await store.createEvalRun(orgId, run);

  try {
    const results: EvalResult[] = [];
    for (const evalCase of cases) {
      const result = await runAnswerPipeline({
        store,
        orgId,
        question: evalCase.question,
        priorTurns: evalCase.priorTurns,
        failureCount: 0,
        page: typeof evalCase.context.page === "string" ? evalCase.context.page : null,
        useModel: false,
      });
      const evaluated = evaluateCase(evalCase, result);
      const record: EvalResult = {
        id: newId(),
        organizationId: orgId,
        runId: run.id,
        caseId: evalCase.id,
        caseKey: evalCase.caseKey,
        category: evalCase.category,
        question: evalCase.question,
        decision: result.decision,
        risk: result.risk,
        sourceIds: evaluated.sourceIds,
        passed: evaluated.passed,
        failures: evaluated.failures,
        latencyMs: result.latencyMs,
        trace: {
          ...result.trace,
          answer: result.answer,
          claims: result.claims,
          expected: {
            decision: evalCase.expectedDecision,
            risk: evalCase.expectedRisk,
            sourceIds: evalCase.expectedSourceIds,
            forbiddenActions: evalCase.forbiddenActions,
          },
          signals: result.policy.signals,
          rules: result.policy.rules,
          answerability: result.policy.answerability,
        },
        createdAt: nowIso(),
      };
      await store.createEvalResult(orgId, record);
      results.push(record);
    }

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const answered = results.filter((r) => r.decision === "answer");
    const unsupported = results.filter((r) => r.category === "unsupported");
    const shouldEscalate = cases.filter(
      (c) => c.expectedDecision === "escalate",
    );
    const nonEscalation = cases.filter((c) => c.expectedDecision !== "escalate");
    const latencies = results.map((r) => r.latencyMs);
    const totalCost = answered.reduce((sum, r) => {
      const trace = r.trace as { estimatedCostUsd?: number };
      return sum + (typeof trace.estimatedCostUsd === "number" ? trace.estimatedCostUsd : 0);
    }, 0);

    const decisionCorrect = results.filter((r) => {
      const c = cases.find((x) => x.id === r.caseId);
      return c ? r.decision === c.expectedDecision : false;
    }).length;

    const metrics: EvalMetrics = {
      decisionAccuracy: total ? decisionCorrect / total : null,
      sourceSelectionAccuracy: total
        ? results.filter((r) => {
            const c = cases.find((x) => x.id === r.caseId);
            if (!c) return false;
            if (c.expectedSourceIds.length) {
              return c.expectedSourceIds.some((id) => r.sourceIds.includes(id));
            }
            return r.sourceIds.length === 0;
          }).length / total
        : null,
      unsupportedAbstainRate: unsupported.length
        ? unsupported.filter((r) => r.decision === "abstain").length /
          unsupported.length
        : null,
      escalationRecall: shouldEscalate.length
        ? shouldEscalate.filter((c) => {
            const r = results.find((x) => x.caseId === c.id);
            return r?.decision === "escalate";
          }).length / shouldEscalate.length
        : null,
      unnecessaryEscalationRate: nonEscalation.length
        ? nonEscalation.filter((c) => {
            const r = results.find((x) => x.caseId === c.id);
            return r?.decision === "escalate";
          }).length / nonEscalation.length
        : null,
      citationCoverage: answered.length
        ? answered.filter((r) => r.sourceIds.length > 0).length / answered.length
        : null,
      medianLatencyMs: median(latencies),
      p95LatencyMs: p95(latencies),
      costPerAnsweredTurnUsd: answered.length ? totalCost / answered.length : null,
    };

    const completedAt = nowIso();
    const updated = await store.updateEvalRun(orgId, run.id, {
      status: "completed",
      total,
      passed,
      metrics,
      completedAt,
    });

    await audit(store, {
      organizationId: orgId,
      actor: input.actor ?? "Trust Center operator",
      action: "evaluation.completed",
      entityType: "eval_run",
      entityId: run.id,
      detail: {
        release: run.release,
        total,
        passed,
        decisionAccuracy: metrics.decisionAccuracy,
      },
    });

    return { run: updated ?? { ...run, metrics, completedAt }, results };
  } catch (error) {
    await store.updateEvalRun(orgId, run.id, {
      status: "failed",
      completedAt: nowIso(),
    });
    throw error;
  }
}
