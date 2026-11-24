import { getStore } from "@/lib/store";
import { json, orgId, route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return route(async () => {
    const store = await getStore();
    const org = orgId();
    const [deliveries, customers, journeys] = await Promise.all([
      store.listDeliveries(org),
      store.listCustomers(org),
      store.listJourneys(org),
    ]);
    const customerById = new Map(customers.map((c) => [c.id, c]));
    const journeyById = new Map(journeys.map((j) => [j.id, j]));
    return json({
      deliveries: deliveries
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map((delivery) => ({
          ...delivery,
          customerName: customerById.get(delivery.customerId)?.name ?? "Unknown",
          journeyName: journeyById.get(delivery.journeyId)?.name ?? "Unknown",
        })),
    });
  });
}
