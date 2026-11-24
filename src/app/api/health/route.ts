import { getRuntimeConfig, featureReport } from "@/lib/env";
import { getStore } from "@/lib/store";
import { orgId, route, json } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return route(async () => {
    const started = Date.now();
    const config = getRuntimeConfig();
    const store = await getStore();
    const org = orgId();
    const [organization, sources, conversations, handoffs, evalRuns] =
      await Promise.all([
        store.getOrganization(org),
        store.listSources(org),
        store.listConversations(org),
        store.listHandoffs(org),
        store.listEvalRuns(org),
      ]);
    const latestEval = evalRuns
      .slice()
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )[0];
    return json({
      status: organization ? "ok" : "degraded",
      service: "proofdesk",
      version: "1.0.0",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      demoMode: config.demoMode,
      storage: {
        driver: store.kind,
        reachable: Boolean(organization),
      },
      data: {
        sources: sources.length,
        activeSources: sources.filter((s) => s.status === "active").length,
        conversations: conversations.length,
        openHandoffs: handoffs.filter(
          (h) => h.status === "pending_confirmation" || h.status === "confirmed",
        ).length,
        latestEvalRun: latestEval
          ? {
              id: latestEval.id,
              status: latestEval.status,
              passed: latestEval.passed,
              total: latestEval.total,
              completedAt: latestEval.completedAt,
            }
          : null,
      },
      integrations: {
        anthropic: config.hasAnthropicKey && !config.demoMode ? "live" : "off",
        resend: config.hasResendKey && !config.demoMode ? "allowlisted" : "sink",
        embeddings:
          config.embeddingProvider !== "none" && config.hasEmbeddingKey
            ? "configured"
            : "off",
        cron: config.hasCronSecret ? "secret-required" : "demo-open",
      },
      features: featureReport(),
    });
  });
}
