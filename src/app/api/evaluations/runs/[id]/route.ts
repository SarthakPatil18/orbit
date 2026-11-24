import { releaseGates } from "@/lib/services/evaluation";
import { getStore } from "@/lib/store";
import { ApiError, json, orgId, route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const { id } = await params;
    const store = await getStore();
    const org = orgId();
    const run = await store.getEvalRun(org, id);
    if (!run) throw new ApiError("Evaluation run not found.", 404, "not_found");
    const results = await store.listEvalResults(org, run.id);
    return json({
      run,
      results,
      gates: releaseGates(run.metrics),
      summary: {
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed).length,
        total: results.length,
      },
    });
  });
}
