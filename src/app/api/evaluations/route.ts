import { releaseGates } from "@/lib/services/evaluation";
import { getStore } from "@/lib/store";
import { json, orgId, route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return route(async () => {
    const store = await getStore();
    const org = orgId();
    const runs = (await store.listEvalRuns(org))
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )
      .slice(0, 10);
    const latest = runs[0] ?? null;
    const results = latest
      ? await store.listEvalResults(org, latest.id)
      : [];
    return json({
      runs,
      latest,
      results,
      gates: latest ? releaseGates(latest.metrics) : [],
    });
  });
}
