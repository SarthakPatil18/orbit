import { testJourney } from "@/lib/email/lifecycle";
import { getStore } from "@/lib/database";
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
    const store = await getStore();
    const org = orgId();
    const journey = await store.getJourney(org, id);
    if (!journey) throw new ApiError("Journey not found.", 404, "not_found");
    const result = await testJourney(store, org, id);
    return json(result, { status: 201 });
  });
}
