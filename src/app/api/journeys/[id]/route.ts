import { getStore } from "@/lib/store";
import { audit } from "@/lib/services/audit";
import {
  ApiError,
  assertSameOrigin,
  json,
  orgId,
  parseBody,
  route,
} from "@/lib/api/http";
import { journeyPatchSchema } from "@/lib/api/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    assertSameOrigin(request);
    const { id } = await params;
    const body = await parseBody(request, journeyPatchSchema);
    const store = await getStore();
    const org = orgId();
    const journey = await store.getJourney(org, id);
    if (!journey) throw new ApiError("Journey not found.", 404, "not_found");
    const updated = await store.updateJourney(org, id, body);
    await audit(store, {
      organizationId: org,
      actor: "Lifecycle operator",
      action: "journey.updated",
      entityType: "journey",
      entityId: id,
      detail: { changes: body },
    });
    return json({ journey: updated });
  });
}
