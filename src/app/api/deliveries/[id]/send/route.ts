import { sendDeliveryNow, queueDelivery } from "@/lib/services/lifecycle";
import { getStore } from "@/lib/store";
import {
  ApiError,
  assertSameOrigin,
  json,
  orgId,
  route,
} from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    assertSameOrigin(request);
    const { id } = await params;
    const mode = new URL(request.url).searchParams.get("mode") ?? "send";
    const store = await getStore();
    const org = orgId();
    if (mode === "queue") {
      const delivery = await queueDelivery(store, org, id);
      return json({ delivery });
    }
    if (mode !== "send") {
      throw new ApiError("Unknown delivery mode.", 400, "bad_request");
    }
    const delivery = await sendDeliveryNow(store, org, id);
    return json({ delivery });
  });
}
