import { processLifecycleEvent } from "@/lib/email/lifecycle";
import { getStore } from "@/lib/database";
import {
  ApiError,
  assertSameOrigin,
  json,
  orgId,
  parseBody,
  route,
} from "@/lib/api/http";
import { checkRateLimit, clientKey } from "@/lib/api/rate-limit";
import { lifecycleEventSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return route(async () => {
    assertSameOrigin(request);
    const limit = checkRateLimit(clientKey(request, "events"), 60, 60_000);
    if (!limit.allowed) throw new ApiError("Too many events.", 429, "rate_limited");
    const body = await parseBody(request, lifecycleEventSchema);
    const store = await getStore();
    const result = await processLifecycleEvent(store, orgId(), {
      type: body.type,
      customerId: body.customerId,
      payload: body.payload,
      occurredAt: body.occurredAt,
    });
    return json(result, { status: 202 });
  });
}
