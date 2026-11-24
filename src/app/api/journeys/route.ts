import { getStore } from "@/lib/database";
import { json, orgId, route } from "@/lib/api/http";
import { sampleJourneyCopy } from "@/lib/email/render";
import { sourceFlags } from "@/lib/knowledge/sources";

export const dynamic = "force-dynamic";

export async function GET() {
  return route(async () => {
    const store = await getStore();
    const org = orgId();
    const [journeys, enrollments, runs, deliveries, customers] = await Promise.all([
      store.listJourneys(org),
      store.listEnrollments(org),
      store.listJourneyRuns(org),
      store.listDeliveries(org),
      store.listCustomers(org),
    ]);
    const customerById = new Map(customers.map((c) => [c.id, c]));
    const organization = await store.getOrganization(org);
    const rows = await Promise.all(journeys.map(async (journey) => {
      const journeyEnrollments = enrollments.filter(
        (e) => e.journeyId === journey.id,
      );
      const journeyDeliveries = deliveries.filter(
        (d) => d.journeyId === journey.id,
      );
      const sample = organization
        ? await sampleJourneyCopy(journey, organization)
        : null;
      return {
        ...journey,
        finalSubject: sample?.subject ?? journey.subject,
        finalPreheader: sample?.preheader ?? journey.preheader,
        finalText: sample?.text ?? "",
        finalHtml: sample?.html ?? "",
        stats: {
          enrollments: journeyEnrollments.length,
          active: journeyEnrollments.filter((e) => e.status === "active").length,
          suppressed: journeyEnrollments.filter((e) => e.status === "suppressed")
            .length,
          completed: journeyEnrollments.filter((e) => e.status === "completed")
            .length,
          previewed: journeyDeliveries.filter((d) => d.status === "previewed")
            .length,
          sent: journeyDeliveries.filter((d) => d.status === "sent").length,
        },
        recentRuns: runs
          .filter((r) => r.journeyId === journey.id)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 5)
          .map((run) => ({
            ...run,
            customerName: customerById.get(
              enrollments.find((e) => e.id === run.enrollmentId)?.customerId ?? "",
            )?.name,
          })),
        recentDeliveries: journeyDeliveries
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 3)
          .map((delivery) => ({
            id: delivery.id,
            customerId: delivery.customerId,
            customerName: customerById.get(delivery.customerId)?.name ?? "Unknown",
            recipient: delivery.recipient,
            subject: delivery.subject,
            status: delivery.status,
            provider: delivery.provider,
            createdAt: delivery.createdAt,
            sentAt: delivery.sentAt,
          })),
      };
    }));
    return json({ journeys: rows });
  });
}

export async function POST() {
  return route(async () => {
    const store = await getStore();
    const org = orgId();
    const sources = await store.listSources(org);
    return json({
      flags: sources.map((source) => ({
        id: source.id,
        title: source.title,
        ...sourceFlags(source, sources),
      })),
    });
  });
}
