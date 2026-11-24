import type {
  Customer,
  Delivery,
  Journey,
  JourneyRun,
} from "@/lib/types";
import { getStore } from "@/lib/database";
import { orgId } from "@/lib/api/http";
import { sampleJourneyCopy } from "@/lib/email/render";
import { JourneysWorkspace } from "@/components/journeys/journeys-workspace";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lifecycle studio",
  description:
    "Four lifecycle journeys with conditions, exits, dedupe, previews, and an in-app email sink.",
};

export default async function JourneysPage() {
  const store = await getStore();
  const org = orgId();
  const [journeys, enrollments, runs, deliveries, customers] = await Promise.all([
    store.listJourneys(org),
    store.listEnrollments(org),
    store.listJourneyRuns(org),
    store.listDeliveries(org),
    store.listCustomers(org),
  ]);

  const customerById = new Map<string, Customer>(customers.map((c) => [c.id, c]));
  const journeyById = new Map<string, Journey>(journeys.map((j) => [j.id, j]));
  const organization = await store.getOrganization(org);

  const journeyRows = await Promise.all(journeys.map(async (journey) => {
    const journeyEnrollments = enrollments.filter((e) => e.journeyId === journey.id);
    const journeyDeliveries = deliveries.filter((d) => d.journeyId === journey.id);
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
        previewed: journeyDeliveries.filter((d) => d.status === "previewed").length,
        sent: journeyDeliveries.filter((d) => d.status === "sent").length,
      },
      recentRuns: runs
        .filter((run) => run.journeyId === journey.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 6)
        .map((run) => ({
          ...run,
          customerName:
            customerById.get(
              enrollments.find((e) => e.id === run.enrollmentId)?.customerId ?? "",
            )?.name ?? "Unknown",
        })),
    };
  }));

  const deliveryRows = deliveries
    .slice()
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((delivery) => ({
      ...delivery,
      customerName: customerById.get(delivery.customerId)?.name ?? "Unknown",
      journeyName: journeyById.get(delivery.journeyId)?.name ?? "Unknown",
    }));

  return (
    <JourneysWorkspace
      initialJourneys={journeyRows}
      initialDeliveries={deliveryRows}
      customers={customers}
      enrollments={enrollments}
    />
  );
}

export type JourneyRow = Journey & {
  finalSubject: string;
  finalPreheader: string;
  finalText: string;
  finalHtml: string;
  stats: {
    enrollments: number;
    active: number;
    suppressed: number;
    completed: number;
    previewed: number;
    sent: number;
  };
  recentRuns: (JourneyRun & { customerName: string })[];
};

export type DeliveryRow = Delivery & {
  customerName: string;
  journeyName: string;
};
