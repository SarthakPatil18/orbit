import { runEvaluationSuite } from "@/lib/services/evaluation";
import { getStore } from "@/lib/store";
import {
  ApiError,
  assertSameOrigin,
  json,
  orgId,
  parseBody,
  route,
} from "@/lib/api/http";
import { checkRateLimit, clientKey } from "@/lib/api/rate-limit";
import { evalRunSchema } from "@/lib/api/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return route(async () => {
    assertSameOrigin(request);
    const limit = checkRateLimit(clientKey(request, "eval-run"), 4, 60_000);
    if (!limit.allowed) {
      throw new ApiError(
        "Evaluation runs are limited to four per minute.",
        429,
        "rate_limited",
      );
    }
    const body = await parseBody(request, evalRunSchema);
    const store = await getStore();
    const { run, results } = await runEvaluationSuite({
      store,
      orgId: orgId(),
      label: body.label,
      release: body.release,
      actor: "Trust Center operator",
    });
    return json({ run, results }, { status: 201 });
  });
}
