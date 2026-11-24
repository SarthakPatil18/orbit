import type { EvalCase, EvalResult, EvalRun } from "@/lib/types";
import { getStore } from "@/lib/store";
import { orgId } from "@/lib/api/http";
import { featureReport, getRuntimeConfig } from "@/lib/env";
import { releaseGates } from "@/lib/evaluation-gates";
import { TrustWorkspace } from "@/components/trust/trust-workspace";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Trust Center",
  description:
    "Run the 20-case golden suite, inspect release gates, and read the ProofDesk decision policy.",
};

export default async function TrustPage() {
  const store = await getStore();
  const org = orgId();
  const [cases, runs] = await Promise.all([
    store.listEvalCases(org),
    store.listEvalRuns(org),
  ]);
  const sortedRuns = runs
    .slice()
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  const latest = sortedRuns[0] ?? null;
  const results: EvalResult[] = latest
    ? await store.listEvalResults(org, latest.id)
    : [];
  const gates = latest ? releaseGates(latest.metrics) : [];
  const config = getRuntimeConfig();

  return (
    <TrustWorkspace
      cases={cases}
      initialRuns={sortedRuns}
      initialLatest={latest}
      initialResults={results}
      initialGates={gates}
      features={featureReport()}
      disclosure={{
        model: config.anthropicModel,
        demoMode: config.demoMode,
        pricingConfigured: config.pricingConfigured,
        modelInputPrice: config.modelInputPrice,
        modelOutputPrice: config.modelOutputPrice,
        storage: config.storageDriver,
        hasResend: config.hasResendKey,
        allowlistedEmail: config.demoEmailTo,
      }}
    />
  );
}

export type { EvalCase, EvalResult, EvalRun };
