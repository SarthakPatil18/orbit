"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleAlert,
  Clock3,
  Download,
  FileJson,
  FileText,
  Gauge,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Timer,
  Users,
  XCircle,
} from "lucide-react";
import type { EvalCase, EvalMetrics, EvalResult, EvalRun } from "@/lib/types";
import type { EvalGate } from "@/lib/evaluation/gates";
import { releaseGates } from "@/lib/evaluation/gates";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
  DecisionBadge,
  RiskBadge,
  SectionHeading,
} from "@/components/ui";

const categoryLabels: Record<EvalCase["category"], string> = {
  answerable: "Answerable",
  unsupported: "Unsupported / abstain",
  escalation: "Escalation",
  memory: "Conversation memory",
  injection: "Injection",
};

const categoryOrder: EvalCase["category"][] = [
  "answerable",
  "unsupported",
  "escalation",
  "memory",
  "injection",
];

function pct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function ms(value: number | null): string {
  return value === null ? "—" : `${value}ms`;
}

function dateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function TrustWorkspace({
  cases,
  initialRuns,
  initialLatest,
  initialResults,
  initialGates,
  features,
  disclosure,
}: {
  cases: EvalCase[];
  initialRuns: EvalRun[];
  initialLatest: EvalRun | null;
  initialResults: EvalResult[];
  initialGates: EvalGate[];
  features: { feature: string; status: string; detail: string }[];
  disclosure: {
    model: string;
    demoMode: boolean;
    pricingConfigured: boolean;
    modelInputPrice: number | null;
    modelOutputPrice: number | null;
    storage: string;
    hasResend: boolean;
    allowlistedEmail: string | null;
  };
}) {
  const [runs, setRuns] = useState<EvalRun[]>(initialRuns);
  const [latest, setLatest] = useState<EvalRun | null>(initialLatest);
  const [results, setResults] = useState<EvalResult[]>(initialResults);
  const [gates, setGates] = useState<EvalGate[]>(initialGates);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EvalCase["category"]>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initialResults[0]?.caseKey ?? null,
  );

  const caseByKey = useMemo(
    () => new Map(cases.map((item) => [item.caseKey, item])),
    [cases],
  );

  const filtered = useMemo(
    () =>
      results.filter((result) =>
        filter === "all" ? true : result.category === filter,
      ),
    [filter, results],
  );

  const selected =
    results.find((result) => result.caseKey === selectedKey) ?? filtered[0] ?? null;

  const categories = categoryOrder.map((category) => {
    const categoryCases = cases.filter((item) => item.category === category);
    const categoryResults = results.filter((r) => r.category === category);
    return {
      category,
      total: categoryCases.length,
      passed: categoryResults.filter((r) => r.passed).length,
      run: categoryResults.length,
    };
  });

  const runSuite = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluations/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        run?: EvalRun;
        results?: EvalResult[];
        error?: string;
      };
      if (!res.ok || !data.run || !data.results) {
        throw new Error(data.error ?? "The evaluation could not complete.");
      }
      setLatest(data.run);
      setResults(data.results);
      setGates(releaseGates(data.run.metrics));
      setRuns((prev) => [data.run!, ...prev]);
      setSelectedKey(data.results[0]?.caseKey ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setRunning(false);
    }
  };

  const exportRun = () => {
    if (!latest) return;
    const payload = {
      run: latest,
      gates,
      results,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `proofdesk-eval-${latest.id.slice(0, 8)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const metrics = latest?.metrics ?? null;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-line bg-[#fffdf8]">
          <div className="page-shell py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5">
                  <ShieldCheck size={12} className="text-forest" />
                  <span className="mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
                    Trust Center · live evaluation
                  </span>
                </div>
                <h1 className="display mt-5 text-[48px] leading-[0.98] sm:text-[62px]">
                  Evidence,
                  <br />
                  not vibes.
                </h1>
                <p className="mt-5 max-w-lg text-[14.5px] leading-relaxed text-muted">
                  ProofDesk is evaluated like a release. Twenty golden cases span
                  answerable questions, unsupported asks, sensitive escalations,
                  conversation memory, and prompt injection. The suite runs the
                  real policy, retrieval, and citation pipeline.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void runSuite()}
                    disabled={running}
                    className="btn btn-primary !px-4 !py-2.5"
                  >
                    {running ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {running ? "Running 20 cases…" : "Run the 20-case suite"}
                  </button>
                  {latest ? (
                    <button
                      type="button"
                      onClick={exportRun}
                      className="btn !px-4 !py-2.5"
                    >
                      <Download size={14} /> Export run JSON
                    </button>
                  ) : null}
                  <Link href="/desk" className="btn btn-ghost !py-2.5">
                    See the desk <ArrowRight size={13} />
                  </Link>
                </div>
                {error ? (
                  <p className="mt-3 flex items-center gap-2 rounded-lg border border-rust/20 bg-rust-soft px-3 py-2 text-[11.5px] text-rust">
                    <CircleAlert size={13} /> {error}
                  </p>
                ) : null}
              </div>

              <div className="surface-dark rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="mono text-[9px] uppercase tracking-[0.12em] text-[#8f9a8a]">
                      Latest run
                    </p>
                    <p className="mt-1 text-[12px] text-[#eef0e7]">
                      {latest ? latest.label : "No evaluation run yet"}
                    </p>
                  </div>
                  <span className="mono rounded border border-[#3b433a] px-2 py-1 text-[8.5px] uppercase tracking-[0.08em] text-[#a9b3a3]">
                    {latest?.release ?? "proofdesk-1.0.0"}
                  </span>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <div className="display text-[64px] leading-none text-[#eef0e7]">
                      {latest ? latest.passed : "—"}
                      <span className="text-[30px] text-[#6f7a6b]">
                        /{latest ? latest.total : cases.length}
                      </span>
                    </div>
                    <p className="mono mt-2 text-[9px] uppercase tracking-[0.1em] text-[#8f9a8a]">
                      cases passed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[26px] font-semibold leading-none text-lime">
                      {metrics ? pct(metrics.decisionAccuracy) : "—"}
                    </p>
                    <p className="mono mt-1 text-[8.5px] uppercase tracking-[0.08em] text-[#8f9a8a]">
                      decision accuracy
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#2c332b] pt-4">
                  <DarkMetric label="Source selection" value={metrics ? pct(metrics.sourceSelectionAccuracy) : "—"} />
                  <DarkMetric label="Citation coverage" value={metrics ? pct(metrics.citationCoverage) : "—"} />
                  <DarkMetric label="Escalation recall" value={metrics ? pct(metrics.escalationRecall) : "—"} />
                  <DarkMetric label="Abstain on unsupported" value={metrics ? pct(metrics.unsupportedAbstainRate) : "—"} />
                  <DarkMetric label="Median latency" value={metrics ? ms(metrics.medianLatencyMs) : "—"} />
                  <DarkMetric label="P95 latency" value={metrics ? ms(metrics.p95LatencyMs) : "—"} />
                </div>
                <p className="mono mt-4 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.08em] text-[#7f8a7a]">
                  <Clock3 size={10} />
                  {latest?.completedAt ? dateTime(latest.completedAt) : "Run the suite to generate real metrics"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="page-shell py-10">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="surface-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="eyebrow">Release gates</p>
                  <p className="mt-1 text-[12px] text-muted">
                    A run is not shippable unless every gate passes.
                  </p>
                </div>
                <span
                  className={`chip !py-1 ${
                    gates.length && gates.every((gate) => gate.passed)
                      ? "!border-forest/20 !bg-forest-soft !text-forest"
                      : "!border-amber/20 !bg-amber-soft !text-amber"
                  }`}
                >
                  {gates.length === 0
                    ? "No run"
                    : gates.every((gate) => gate.passed)
                      ? "All gates passed"
                      : "Gate failure"}
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(gates.length ? gates : releaseGates(emptyMetrics())).map((gate) => (
                  <div
                    key={gate.key}
                    className={`rounded-lg border px-3 py-2.5 ${
                      gates.length === 0
                        ? "border-line bg-paper/60"
                        : gate.passed
                          ? "border-forest/20 bg-forest-soft/40"
                          : "border-rust/25 bg-rust-soft/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-medium">{gate.label}</span>
                      {gates.length === 0 ? (
                        <span className="mono text-[9px] text-muted">—</span>
                      ) : gate.passed ? (
                        <Check size={12} className="text-forest" />
                      ) : (
                        <XCircle size={12} className="text-rust" />
                      )}
                    </div>
                    <div className="mono mt-1 flex items-center justify-between text-[8.5px] uppercase tracking-[0.06em] text-muted">
                      <span>{gate.value === null ? "no data" : pct(gate.value)}</span>
                      <span>{gate.threshold}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card p-5">
              <p className="eyebrow">Category coverage</p>
              <div className="mt-3 space-y-2.5">
                {categories.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between gap-2 text-[10.5px]">
                      <span className="font-medium">{categoryLabels[category.category]}</span>
                      <span className="mono text-[9px] text-muted">
                        {category.run ? `${category.passed}/${category.run}` : `0/${category.total}`}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-2">
                      <div
                        className="h-full rounded-full bg-forest"
                        style={{
                          width: `${
                            category.total
                              ? (category.passed / category.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[12px] leading-relaxed text-muted">
                8 answerable · 4 abstain · 4 escalate · 2 memory · 2 injection.
                Expectations are deterministic; no model key is required.
              </p>
            </div>
          </div>
        </section>

        <section className="page-shell pb-12">
          <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
            <div className="surface-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
                <div>
                  <p className="eyebrow">Golden set</p>
                  <p className="mt-1 text-[12px] text-muted">
                    {results.length
                      ? `${results.filter((r) => r.passed).length} passed · ${
                          results.filter((r) => !r.passed).length
                        } failed`
                      : "Run the suite to populate results."}
                  </p>
                </div>
                <div className="flex max-w-full flex-wrap gap-1.5">
                  {(["all", ...categoryOrder] as const).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setFilter(category)}
                      className={`press min-h-10 rounded-full border px-3 text-[12px] font-medium ${
                        filter === category
                          ? "border-ink bg-ink text-paper"
                          : "border-line bg-white/60 text-muted hover:text-ink"
                      }`}
                    >
                      {category === "all" ? "All" : categoryLabels[category]}
                    </button>
                  ))}
                </div>
              </div>

              {results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
                  <Gauge size={28} className="text-muted" />
                  <p className="text-[13px] font-medium">No results yet</p>
                  <p className="max-w-xs text-[11.5px] leading-relaxed text-muted">
                    The suite executes the real pipeline and writes each result and
                    trace. Nothing is precomputed.
                  </p>
                  <button
                    type="button"
                    onClick={() => void runSuite()}
                    disabled={running}
                    className="btn btn-primary mt-1 !px-3 !py-1.5 !text-[11px]"
                  >
                    {running ? "Running…" : "Run now"}
                  </button>
                </div>
              ) : (
                <div className="scroll-thin max-h-[640px] overflow-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-paper-2/90 backdrop-blur">
                      <tr className="border-b border-line">
                        {["Case", "Category", "Decision", "Risk", "Sources", "Result"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="mono px-3 py-2.5 text-[8.5px] uppercase tracking-[0.1em] text-muted"
                            >
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((result) => {
                        const active = selected?.id === result.id;
                        return (
                          <tr
                            key={result.id}
                            onClick={() => setSelectedKey(result.caseKey)}
                            className={`cursor-pointer border-b border-line/70 transition-colors ${
                              active ? "bg-forest-soft/40" : "hover:bg-paper/60"
                            }`}
                          >
                            <td className="max-w-[240px] px-3 py-2.5">
                              <div className="mono text-[8px] uppercase tracking-[0.06em] text-muted">
                                {result.caseKey}
                              </div>
                              <div className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug">
                                {result.question}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-[9.5px] text-muted">
                              {categoryLabels[result.category]}
                            </td>
                            <td className="px-3 py-2.5">
                              <DecisionBadge decision={result.decision} short />
                            </td>
                            <td className="px-3 py-2.5">
                              <RiskBadge risk={result.risk} />
                            </td>
                            <td className="mono px-3 py-2.5 text-[9px] text-muted">
                              {result.sourceIds.length
                                ? result.sourceIds.join(", ")
                                : "—"}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`chip !py-0.5 !text-[9px] ${
                                  result.passed
                                    ? "!border-forest/20 !bg-forest-soft !text-forest"
                                    : "!border-rust/25 !bg-rust-soft !text-rust"
                                }`}
                              >
                                {result.passed ? (
                                  <Check size={9} />
                                ) : (
                                  <XCircle size={9} />
                                )}
                                {result.passed ? "pass" : "fail"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="surface-card h-fit p-4 xl:sticky xl:top-[78px]">
              <p className="eyebrow">Case inspector</p>
              {selected ? (
                <ResultDetail
                  result={selected}
                  evalCase={caseByKey.get(selected.caseKey) ?? null}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <FileText size={22} className="text-muted" />
                  <p className="text-[11.5px] text-muted">
                    Select a case to inspect the expected outcome, sources, and
                    decision trace.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-[#fffdf8]">
          <div className="page-shell py-14">
            <SectionHeading
              eyebrow="Decision policy"
              title="The policy engine decides. The model only writes."
              body="Autonomy is evidence-conditioned per turn. These rules run before any generation and are recorded in every trace."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PolicyCard
                label="answer"
                title="Cite or don't speak"
                body="Requires a confident top source, an adequate margin over the runner-up, no stale top source, no unresolved conflict, and no missing required detail."
              />
              <PolicyCard
                label="clarify"
                title="Ask one useful question"
                body="When the request is answerable in principle but ambiguous — event, workspace, or the exact task — ask once instead of guessing."
              />
              <PolicyCard
                label="abstain"
                title="Say “I don't know”"
                body="Out of scope, third-party promises, stale-only evidence, contradictory sources, or hidden instructions. No invented capability."
              />
              <PolicyCard
                label="escalate"
                title="Bring in a person"
                body="Payment disputes, deletions, identity changes, security concerns, injection attempts, explicit human requests, repeated failure, or strong frustration."
              />
            </div>
            <div className="mt-5 rounded-xl border border-rust/20 bg-rust-soft/40 p-4">
              <p className="flex items-start gap-2 text-[12px] leading-relaxed text-rust">
                <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                <span>
                  <strong>Hard boundary:</strong> refunds, deletions, identity
                  changes, and payment-detail edits are never executed from chat.
                  The pipeline records{" "}
                  <span className="mono text-[10px]">actionsExecuted: []</span> and
                  routes the case with a prepared handoff. The model cannot override
                  this.
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="page-shell py-14">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="surface-card p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="eyebrow">Run history</p>
                  <p className="mt-1 text-[12px] text-muted">
                    Every run is persisted with per-case results and traces.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void runSuite()}
                  disabled={running}
                  className="btn !px-2.5 !py-1.5 !text-[10.5px]"
                >
                  <RefreshCw size={11} /> Re-run
                </button>
              </div>
              <div className="mt-3 divide-y divide-line">
                {runs.length ? (
                  runs.slice(0, 8).map((run) => (
                    <div
                      key={run.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium">{run.label}</p>
                        <p className="mono mt-0.5 text-[8.5px] uppercase tracking-[0.06em] text-muted">
                          {run.release} · {dateTime(run.startedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="mono text-[10px] text-muted">
                          {run.passed}/{run.total}
                        </span>
                        <span
                          className={`mono rounded px-1.5 py-0.5 text-[8px] uppercase ${
                            run.status === "completed"
                              ? "bg-forest-soft text-forest"
                              : run.status === "failed"
                                ? "bg-rust-soft text-rust"
                                : "bg-amber-soft text-amber"
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-[11px] text-muted">
                    No runs recorded.
                  </p>
                )}
              </div>
            </div>

            <div className="surface-card p-5">
              <p className="eyebrow">Integration reality</p>
              <div className="mt-3 space-y-2.5">
                {features.map((feature) => (
                  <div key={feature.feature}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium">{feature.feature}</span>
                      <span
                        className={`mono rounded px-1.5 py-0.5 text-[8px] uppercase tracking-[0.06em] ${
                          feature.status === "real"
                            ? "bg-forest-soft text-forest"
                            : feature.status === "deterministic"
                              ? "bg-sky-soft text-sky"
                              : feature.status === "configured"
                                ? "bg-forest-soft text-forest"
                                : "bg-amber-soft text-amber"
                        }`}
                      >
                        {feature.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-snug text-muted">
                      {feature.detail}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-line bg-paper/60 p-3">
                <p className="mono flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.08em] text-muted">
                  <Timer size={10} /> No fake metrics
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">
                  Metrics are computed from the run you trigger. The deterministic
                  generator makes runs reproducible; optional Claude output is only
                  used outside demo mode and still passes citation verification.
                </p>
              </div>
            </div>
          </div>

          <section
            id="disclosure"
            className="surface-card mt-4 p-5"
            aria-label="Full disclosure"
          >
            <p className="eyebrow">Full disclosure</p>
            <h2 className="mt-2 text-[20px] font-semibold">What this prototype actually does</h2>
            <div className="mt-4 grid gap-4 text-[12px] leading-relaxed text-ink-2 md:grid-cols-2">
              <p>
                <span className="font-semibold">Model. </span>
                {disclosure.demoMode
                  ? `Demo mode is on, so answers are composed by the deterministic policy from approved sources. The optional generator is ${disclosure.model}. It is not called.`
                  : `Live mode calls ${disclosure.model} with approved excerpts, then checks every claim against those excerpts.`}
                {" "}It was selected because a short excerpt-grounded draft is useful, while the policy engine — not the model — still chooses answer, clarify, abstain, or escalate.
              </p>
              <p>
                <span className="font-semibold">Fallback. </span>
                If the model is enabled and the provider errors, times out, or the circuit breaker is open, the turn is labeled “Model/provider unavailable” and the approved deterministic answer is used. Demo mode labels itself “Deterministic demo” instead of pretending the provider failed.
              </p>
              <p>
                <span className="font-semibold">Email. </span>
                {disclosure.demoMode || !disclosure.hasResend
                  ? "Lifecycle mail in this demo is previewed in the in-app sink and labeled previewed. It is not sent."
                  : `Resend is configured. A delivery is sent only to ${disclosure.allowlistedEmail ?? "the allowlisted DEMO_EMAIL_TO address"}. Every other recipient stays blocked.`}
                {" "}Preview-sink cost is $0. This prototype does not invent a per-email provider price.
              </p>
              <p>
                <span className="font-semibold">Cost. </span>
                Deterministic answers are recorded at $0. No vendor price list was fetched on 24 November 2026.
                {disclosure.pricingConfigured
                  ? ` Operator-configured rates are $${disclosure.modelInputPrice} per million input tokens and $${disclosure.modelOutputPrice} per million output tokens. Live cost is (input tokens × input rate + output tokens × output rate) / 1,000,000.`
                  : " MODEL_INPUT_USD_PER_MILLION and MODEL_OUTPUT_USD_PER_MILLION are unset, so no model dollar amount is estimated."}
              </p>
              <p>
                <span className="font-semibold">What breaks first. </span>
                The file store is single-process. A second server does not share it. The in-memory rate limiter and model circuit breaker reset on restart. The optional model times out after 12 seconds.
              </p>
              <p>
                <span className="font-semibold">Persistence and security. </span>
                Storage driver: {disclosure.storage}. Conversations, handoffs, journey runs, and deliveries survive refresh on this instance.
                {" "}There is no login. The agent desk is open in the demo. Mutations check same-origin only. Do not put real customer data here.
              </p>
            </div>
          </section>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Caveat
              icon={<Users size={15} />}
              title="Synthetic data"
              body="Every customer, ticket, payment, and email is fictional. No real customer data is processed."
            />
            <Caveat
              icon={<FileJson size={15} />}
              title="Inspectable traces"
              body="Each case persists retrieval candidates, signals, rules, verification, and the final decision."
            />
            <Caveat
              icon={<BadgeCheck size={15} />}
              title="Honest limits"
              body="Single-instance rate limiting, no auth, file storage by default. PostgreSQL and migrations are included."
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[16px] font-semibold leading-none text-[#eef0e7]">{value}</p>
      <p className="mono mt-1 text-[8px] uppercase tracking-[0.06em] text-[#7f8a7a]">
        {label}
      </p>
    </div>
  );
}

function PolicyCard({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper/40 p-4">
      <span className="mono rounded bg-white px-1.5 py-0.5 text-[8.5px] uppercase tracking-[0.08em] text-forest">
        {label}
      </span>
      <h3 className="mt-3 text-[13px] font-semibold">{title}</h3>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Caveat({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-[#fffdf8] p-4">
      <span className="text-forest">{icon}</span>
      <h3 className="mt-2.5 text-[12px] font-semibold">{title}</h3>
      <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function ResultDetail({
  result,
  evalCase,
}: {
  result: EvalResult;
  evalCase: EvalCase | null;
}) {
  const [showRaw, setShowRaw] = useState(false);
  const trace = result.trace as {
    expected?: {
      decision?: string;
      risk?: string;
      sourceIds?: string[];
      forbiddenActions?: string[];
    };
    answer?: string;
    claims?: { text: string; sourceIds: string[] }[];
    signals?: { code: string; label: string; severity: string }[];
    rules?: { id: string; label: string; triggered: boolean }[];
    retrieval?: {
      mode?: string;
      topScore?: number;
      margin?: number;
      threshold?: number;
      candidates?: { sourceId: string; sourceTitle: string; score: number }[];
    };
    answerability?: { score?: number; sufficient?: boolean; reasons?: string[] };
    verification?: { passed?: boolean; checkedClaims?: number; failures?: string[] };
    actionsExecuted?: string[];
  };

  return (
    <div className="mt-2 space-y-3">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`chip !py-0.5 !text-[9px] ${
              result.passed
                ? "!border-forest/20 !bg-forest-soft !text-forest"
                : "!border-rust/25 !bg-rust-soft !text-rust"
            }`}
          >
            {result.passed ? <Check size={9} /> : <XCircle size={9} />}
            {result.passed ? "passed" : "failed"}
          </span>
          <DecisionBadge decision={result.decision} short />
          <RiskBadge risk={result.risk} />
        </div>
        <p className="mt-2 text-[12px] font-medium leading-snug">{result.question}</p>
        <p className="mono mt-1 text-[8.5px] uppercase tracking-[0.06em] text-muted">
          {result.caseKey} · {categoryLabels[result.category]} · {result.latencyMs}ms
        </p>
      </div>

      {result.failures.length ? (
        <div className="rounded-lg border border-rust/25 bg-rust-soft/50 p-2.5">
          <p className="mono text-[8px] uppercase tracking-[0.08em] text-rust">
            Failures
          </p>
          <ul className="mt-1 space-y-1">
            {result.failures.map((failure) => (
              <li key={failure} className="text-[10px] leading-snug text-rust">
                · {failure}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-lg border border-line bg-paper/50 p-2.5">
        <p className="mono text-[8px] uppercase tracking-[0.08em] text-muted">
          Expected
        </p>
        <div className="mono mt-1 space-y-0.5 text-[9.5px] text-ink-2">
          <div>decision · {evalCase?.expectedDecision ?? trace.expected?.decision ?? "—"}</div>
          <div>risk · {evalCase?.expectedRisk ?? trace.expected?.risk ?? "—"}</div>
          <div>
            sources ·{" "}
            {(evalCase?.expectedSourceIds ?? trace.expected?.sourceIds ?? []).join(", ") ||
              "none"}
          </div>
          <div>
            forbidden ·{" "}
            {(evalCase?.forbiddenActions ?? trace.expected?.forbiddenActions ?? []).join(", ") ||
              "none"}
          </div>
        </div>
      </div>

      {trace.answer ? (
        <div>
          <p className="mono text-[8px] uppercase tracking-[0.08em] text-muted">
            Answer
          </p>
          <p className="mt-1 line-clamp-6 text-[10.5px] leading-relaxed text-ink-2">
            {trace.answer}
          </p>
        </div>
      ) : null}

      {trace.retrieval ? (
        <div className="rounded-lg border border-line bg-white p-2.5">
          <p className="mono text-[8px] uppercase tracking-[0.08em] text-muted">
            Retrieval
          </p>
          <div className="mono mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-muted">
            <span>mode · {trace.retrieval.mode ?? "—"}</span>
            <span>top · {trace.retrieval.topScore?.toFixed(2) ?? "—"}</span>
            <span>margin · {trace.retrieval.margin?.toFixed(2) ?? "—"}</span>
            <span>threshold · {trace.retrieval.threshold?.toFixed(2) ?? "—"}</span>
          </div>
          {(trace.retrieval.candidates ?? []).slice(0, 3).map((candidate) => (
            <div
              key={candidate.sourceId}
              className="mt-1 flex items-center justify-between gap-2 text-[9.5px]"
            >
              <span className="truncate">{candidate.sourceTitle}</span>
              <span className="mono text-[8.5px] text-muted">
                {candidate.score.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {trace.signals?.length ? (
        <div>
          <p className="mono text-[8px] uppercase tracking-[0.08em] text-muted">
            Signals
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {trace.signals.slice(0, 6).map((signal) => (
              <span
                key={signal.code}
                className={`mono rounded px-1.5 py-0.5 text-[8px] uppercase ${
                  signal.severity === "critical"
                    ? "bg-rust-soft text-rust"
                    : signal.severity === "warn"
                      ? "bg-amber-soft text-amber"
                      : "bg-forest-soft text-forest"
                }`}
              >
                {signal.code}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {trace.rules?.length ? (
        <div>
          <p className="mono text-[8px] uppercase tracking-[0.08em] text-muted">
            Triggered rules
          </p>
          <div className="mt-1 space-y-0.5">
            {trace.rules
              .filter((rule) => rule.triggered)
              .slice(0, 5)
              .map((rule) => (
                <p key={rule.id} className="text-[9.5px] text-muted">
                  · {rule.label}
                </p>
              ))}
            {trace.rules.filter((rule) => rule.triggered).length === 0 ? (
              <p className="text-[9.5px] text-muted">No rule triggered.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <span className="mono flex items-center gap-1 text-[8px] uppercase tracking-[0.06em] text-forest">
          <ShieldCheck size={9} /> actions executed ·{" "}
          {trace.actionsExecuted?.length ? trace.actionsExecuted.length : "none"}
        </span>
        <button
          type="button"
          onClick={() => setShowRaw((value) => !value)}
          className="mono text-[8px] uppercase tracking-[0.08em] text-muted hover:text-ink"
        >
          {showRaw ? "Hide raw" : "Raw trace"}
        </button>
      </div>
      {showRaw ? (
        <pre className="scroll-thin max-h-56 overflow-auto rounded-lg border border-line bg-paper-2/60 p-2 text-[8px] leading-relaxed text-muted">
          {JSON.stringify(result.trace, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function emptyMetrics(): EvalMetrics {
  return {
    decisionAccuracy: null,
    sourceSelectionAccuracy: null,
    unsupportedAbstainRate: null,
    escalationRecall: null,
    unnecessaryEscalationRate: null,
    citationCoverage: null,
    medianLatencyMs: null,
    p95LatencyMs: null,
    costPerAnsweredTurnUsd: null,
  };
}
