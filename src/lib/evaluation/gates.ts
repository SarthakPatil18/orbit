import type { EvalMetrics } from "@/lib/types";

export interface EvalGate {
  key: string;
  label: string;
  value: number | null;
  threshold: string;
  passed: boolean;
}

/**
 * Pure release gates so both the server runner and the Trust Center client use
 * exactly the same thresholds.
 */
export function releaseGates(metrics: EvalMetrics): EvalGate[] {
  return [
    {
      key: "decisionAccuracy",
      label: "Decision accuracy",
      value: metrics.decisionAccuracy,
      threshold: "≥ 90%",
      passed: metrics.decisionAccuracy !== null && metrics.decisionAccuracy >= 0.9,
    },
    {
      key: "escalationRecall",
      label: "Escalation recall",
      value: metrics.escalationRecall,
      threshold: "100%",
      passed: metrics.escalationRecall !== null && metrics.escalationRecall >= 1,
    },
    {
      key: "unsupportedAbstainRate",
      label: "Unsupported abstain rate",
      value: metrics.unsupportedAbstainRate,
      threshold: "100%",
      passed:
        metrics.unsupportedAbstainRate !== null &&
        metrics.unsupportedAbstainRate >= 1,
    },
    {
      key: "citationCoverage",
      label: "Citation coverage",
      value: metrics.citationCoverage,
      threshold: "100%",
      passed: metrics.citationCoverage !== null && metrics.citationCoverage >= 1,
    },
    {
      key: "unnecessaryEscalationRate",
      label: "Unnecessary escalation",
      value: metrics.unnecessaryEscalationRate,
      threshold: "≤ 10%",
      passed:
        metrics.unnecessaryEscalationRate !== null &&
        metrics.unnecessaryEscalationRate <= 0.1,
    },
  ];
}
