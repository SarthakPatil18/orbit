import { getStore } from "@/lib/database";
import { audit } from "@/lib/support/audit";
import {
  ApiError,
  assertSameOrigin,
  json,
  orgId,
  parseBody,
  route,
} from "@/lib/api/http";
import { handoffConfirmSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    assertSameOrigin(request);
    const { id } = await params;
    const body = await parseBody(request, handoffConfirmSchema);
    const store = await getStore();
    const org = orgId();
    const handoff = await store.getHandoff(org, id);
    if (!handoff) throw new ApiError("Handoff not found.", 404, "not_found");
    if (handoff.status === "confirmed" || handoff.status === "claimed") {
      return json({ handoff, alreadyConfirmed: true });
    }
    const updated = await store.updateHandoff(org, id, {
      status: "confirmed",
    });
    await audit(store, {
      organizationId: org,
      actor: "Customer",
      action: "handoff.confirmed",
      entityType: "handoff",
      entityId: id,
      detail: {
        queue: handoff.destinationQueue,
        note: body.note ?? null,
        conversationId: handoff.conversationId,
      },
    });
    return json({ handoff: updated, alreadyConfirmed: false });
  });
}
