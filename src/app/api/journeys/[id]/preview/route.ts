import { z } from "zod";
import { getStore } from "@/lib/database";
import { renderLifecycleEmail } from "@/lib/email/render";
import {
  ApiError,
  assertSameOrigin,
  json,
  orgId,
  parseBody,
  route,
} from "@/lib/api/http";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  customerId: z.string().uuid().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    assertSameOrigin(request);
    const { id } = await params;
    const body = await parseBody(request, bodySchema);
    const store = await getStore();
    const org = orgId();
    const journey = await store.getJourney(org, id);
    if (!journey) throw new ApiError("Journey not found.", 404, "not_found");
    const organization = await store.getOrganization(org);
    if (!organization) throw new ApiError("Organization not found.", 404, "not_found");
    const customers = await store.listCustomers(org);
    const customer = body.customerId
      ? customers.find((c) => c.id === body.customerId)
      : customers.find((c) => c.email === "maya@kathacollective.in") ?? customers[0];
    if (!customer) throw new ApiError("Customer not found.", 404, "not_found");
    const rendered = await renderLifecycleEmail({
      journey,
      customer,
      organization,
    });
    return json({
      journey,
      customer: { id: customer.id, name: customer.name, email: customer.email },
      rendered,
    });
  });
}
