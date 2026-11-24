import type { Store } from "@/lib/database";
import type {
  Customer,
  Delivery,
  Journey,
  JourneyEnrollment,
  JourneyRun,
  Organization,
} from "@/lib/types";
import { newId, nowIso, slugify } from "@/lib/ids";
import { getRuntimeConfig } from "@/lib/env";
import { renderLifecycleEmail, formatPeriodEnd } from "./render";
import { audit } from "@/lib/support/audit";

export const LIFECYCLE_EVENTS = [
  "user.created",
  "user.inactive",
  "feature.released",
  "subscription.cancelled",
  "subscription.reactivated",
  "event.published",
  "draft.deleted",
  "reminder.snoozed",
  "feature.adopted",
  "event.completed",
] as const;

export type LifecycleEventType = (typeof LIFECYCLE_EVENTS)[number];

export interface LifecycleEventInput {
  type: LifecycleEventType;
  customerId: string;
  payload: Record<string, unknown>;
  occurredAt?: string;
}

export interface LifecycleOutcome {
  journeyKey: string;
  journeyName: string;
  status: "enrolled" | "suppressed" | "completed" | "cancelled" | "error";
  detail: string;
  enrollmentId: string | null;
  deliveryId: string | null;
}

export interface LifecycleResult {
  eventId: string;
  eventType: LifecycleEventType;
  customerId: string;
  outcomes: LifecycleOutcome[];
}

function daysBetween(now: Date, then: string): number {
  return (now.getTime() - new Date(then).getTime()) / 86_400_000;
}

function dedupeKeyFor(journey: Journey, customer: Customer, payload: Record<string, unknown>): string {
  switch (journey.key) {
    case "welcome":
      return `welcome:${customer.id}`;
    case "inactivity-nudge":
      return `inactivity:${customer.id}:${(customer.draftUpdatedAt ?? "").slice(0, 10)}`;
    case "offline-checkin":
      return `feature:${slugify(customer.club)}:${String(payload.release ?? "offline-checkin-v1")}`;
    case "offboarding":
      return `offboarding:${customer.id}:${(customer.periodEnd ?? "").slice(0, 10)}`;
    default:
      return `${journey.key}:${customer.id}`;
  }
}

function conditionFor(
  journey: Journey,
  customer: Customer,
  payload: Record<string, unknown>,
  now: Date,
): { eligible: boolean; reason: string } {
  switch (journey.key) {
    case "welcome": {
      const owner = payload.workspaceOwner === true || customer.role === "owner";
      if (!owner) return { eligible: false, reason: "Customer is not a workspace owner." };
      return { eligible: true, reason: "New workspace owner." };
    }
    case "inactivity-nudge": {
      const inactiveDays = daysBetween(now, customer.lastActiveAt);
      if (inactiveDays < 7) {
        return {
          eligible: false,
          reason: `Active ${Math.max(0, Math.floor(inactiveDays))} day(s) ago; threshold is 7.`,
        };
      }
      if (!customer.draftEventName) {
        return { eligible: false, reason: "No unfinished event draft." };
      }
      return {
        eligible: true,
        reason: `Inactive ${Math.floor(inactiveDays)} days with draft “${customer.draftEventName}”.`,
      };
    }
    case "offline-checkin": {
      const release = String(payload.release ?? "");
      if (release !== "offline-checkin-v1") {
        return {
          eligible: false,
          reason: `Release “${release || "unknown"}” is not offline-checkin-v1.`,
        };
      }
      if (!customer.upcomingEventName) {
        return { eligible: false, reason: "Workspace has no upcoming event." };
      }
      return {
        eligible: true,
        reason: `Upcoming event “${customer.upcomingEventName}” is eligible for offline check-in.`,
      };
    }
    case "offboarding": {
      const billingVerified =
        String(payload.billingStatus ?? customer.billingStatus) === "cancelled" &&
        customer.billingStatus === "cancelled";
      if (!billingVerified) {
        return {
          eligible: false,
          reason: "Cancellation is not verified by the billing state.",
        };
      }
      return {
        eligible: true,
        reason: `Cancellation verified; Pro ends on ${formatPeriodEnd(customer.periodEnd)}.`,
      };
    }
    default:
      return { eligible: false, reason: "No condition defined." };
  }
}

async function recordOutcome(
  store: Store,
  orgId: string,
  journey: Journey,
  customer: Customer,
  eventType: string,
  payload: Record<string, unknown>,
  status: JourneyRun["status"],
  detail: string,
  enrollmentId: string | null,
): Promise<JourneyRun> {
  const run: JourneyRun = {
    id: newId(),
    organizationId: orgId,
    journeyId: journey.id,
    enrollmentId,
    eventType,
    eventPayload: payload,
    status,
    detail,
    createdAt: nowIso(),
  };
  return store.createJourneyRun(orgId, run);
}

async function createSuppressedEnrollment(
  store: Store,
  orgId: string,
  journey: Journey,
  customer: Customer,
  reason: string,
  dedupeKey: string,
): Promise<JourneyEnrollment> {
  const now = nowIso();
  const enrollment: JourneyEnrollment = {
    id: newId(),
    organizationId: orgId,
    journeyId: journey.id,
    customerId: customer.id,
    status: "suppressed",
    suppressionReason: reason,
    dedupeKey,
    enteredAt: now,
    completedAt: null,
    updatedAt: now,
  };
  return store.createEnrollment(orgId, enrollment);
}

async function enroll(
  store: Store,
  orgId: string,
  org: Organization,
  journey: Journey,
  customer: Customer,
  eventType: string,
  payload: Record<string, unknown>,
  reason: string,
): Promise<LifecycleOutcome> {
  const now = nowIso();
  const dedupeKey = dedupeKeyFor(journey, customer, payload);
  const existing = await store.findEnrollmentByDedupe(orgId, journey.id, dedupeKey);
  if (existing) {
    const suppressionReason = `Entry limit reached: ${journey.entryLimit ?? "already enrolled"}.`;
    const enrollment = await createSuppressedEnrollment(
      store,
      orgId,
      journey,
      customer,
      suppressionReason,
      dedupeKey,
    );
    await recordOutcome(
      store,
      orgId,
      journey,
      customer,
      eventType,
      payload,
      "suppressed",
      suppressionReason,
      enrollment.id,
    );
    await audit(store, {
      organizationId: orgId,
      actor: "Lifecycle engine",
      action: "journey.suppressed",
      entityType: "journey_enrollment",
      entityId: enrollment.id,
      detail: { journey: journey.key, reason: suppressionReason, customerId: customer.id },
    });
    return {
      journeyKey: journey.key,
      journeyName: journey.name,
      status: "suppressed",
      detail: suppressionReason,
      enrollmentId: enrollment.id,
      deliveryId: null,
    };
  }

  const enrollment: JourneyEnrollment = {
    id: newId(),
    organizationId: orgId,
    journeyId: journey.id,
    customerId: customer.id,
    status: "active",
    suppressionReason: null,
    dedupeKey,
    enteredAt: now,
    completedAt: null,
    updatedAt: now,
  };
  await store.createEnrollment(orgId, enrollment);

  let delivery: Delivery | null = null;
  try {
    const rendered = await renderLifecycleEmail({
      journey,
      customer,
      organization: org,
    });
    const suppressed = customer.emailOptOut;
    delivery = {
      id: newId(),
      organizationId: orgId,
      journeyId: journey.id,
      enrollmentId: enrollment.id,
      customerId: customer.id,
      recipient: customer.email,
      subject: rendered.subject,
      preheader: rendered.preheader,
      html: rendered.html,
      text: rendered.text,
      status: suppressed ? "suppressed" : "previewed",
      provider: getRuntimeConfig().demoMode ? "demo-sink" : "resend",
      error: suppressed
        ? "Customer opted out of lifecycle email."
        : null,
      attempts: 0,
      scheduledFor: null,
      sentAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await store.createDelivery(orgId, delivery);
    if (suppressed) {
      await store.updateEnrollment(orgId, enrollment.id, {
        status: "suppressed",
        suppressionReason: "Customer opted out of lifecycle email.",
      });
    }
  } catch (error) {
    await recordOutcome(
      store,
      orgId,
      journey,
      customer,
      eventType,
      payload,
      "error",
      `Email render failed: ${error instanceof Error ? error.message : "unknown error"}`,
      enrollment.id,
    );
    return {
      journeyKey: journey.key,
      journeyName: journey.name,
      status: "error",
      detail: "Email render failed. The enrollment is retained for retry.",
      enrollmentId: enrollment.id,
      deliveryId: null,
    };
  }

  const detail = `${reason} Email ${delivery.status === "suppressed" ? "suppressed" : "previewed in the sink"}.`;
  await recordOutcome(
    store,
    orgId,
    journey,
    customer,
    eventType,
    payload,
    delivery.status === "suppressed" ? "suppressed" : "enrolled",
    detail,
    enrollment.id,
  );
  await audit(store, {
    organizationId: orgId,
    actor: "Lifecycle engine",
    action: delivery.status === "suppressed" ? "journey.suppressed" : "journey.enrolled",
    entityType: "journey_enrollment",
    entityId: enrollment.id,
    detail: {
      journey: journey.key,
      deliveryId: delivery.id,
      reason,
      customerId: customer.id,
    },
  });
  return {
    journeyKey: journey.key,
    journeyName: journey.name,
    status: delivery.status === "suppressed" ? "suppressed" : "enrolled",
    detail,
    enrollmentId: enrollment.id,
    deliveryId: delivery.id,
  };
}

async function applyExits(
  store: Store,
  orgId: string,
  journeys: Journey[],
  customer: Customer,
  eventType: LifecycleEventType,
  payload: Record<string, unknown>,
): Promise<LifecycleOutcome[]> {
  const exitsByJourney: Record<string, string[]> = {
    welcome: ["event.published"],
    "inactivity-nudge": ["event.published", "draft.deleted", "reminder.snoozed"],
    "offline-checkin": ["feature.adopted", "event.completed"],
    offboarding: ["subscription.reactivated"],
  };
  const outcomes: LifecycleOutcome[] = [];
  const enrollments = await store.listEnrollments(orgId);
  const deliveries = await store.listDeliveries(orgId);
  for (const journey of journeys) {
    const rules = exitsByJourney[journey.key] ?? [];
    if (!rules.includes(eventType)) continue;
    const active = enrollments.filter(
      (e) =>
        e.journeyId === journey.id &&
        e.customerId === customer.id &&
        e.status === "active",
    );
    if (!active.length) continue;
    const terminal =
      eventType === "event.published" || eventType === "feature.adopted"
        ? "completed"
        : "cancelled";
    for (const enrollment of active) {
      await store.updateEnrollment(orgId, enrollment.id, {
        status: terminal,
        completedAt: nowIso(),
      });
      for (const delivery of deliveries.filter(
        (d) =>
          d.enrollmentId === enrollment.id &&
          (d.status === "previewed" || d.status === "queued"),
      )) {
        await store.updateDelivery(orgId, delivery.id, {
          status: "suppressed",
          error: `Cancelled by ${eventType}.`,
        });
      }
      await recordOutcome(
        store,
        orgId,
        journey,
        customer,
        eventType,
        payload,
        terminal,
        `Journey ${terminal} by ${eventType}.`,
        enrollment.id,
      );
    }
    await audit(store, {
      organizationId: orgId,
      actor: "Lifecycle engine",
      action: `journey.${terminal}`,
      entityType: "journey",
      entityId: journey.id,
      detail: { customerId: customer.id, eventType, count: active.length },
    });
    outcomes.push({
      journeyKey: journey.key,
      journeyName: journey.name,
      status: terminal,
      detail: `Journey ${terminal} by ${eventType}.`,
      enrollmentId: active[0]?.id ?? null,
      deliveryId: null,
    });
  }
  return outcomes;
}

export async function processLifecycleEvent(
  store: Store,
  orgId: string,
  input: LifecycleEventInput,
): Promise<LifecycleResult> {
  const customer = await store.getCustomer(orgId, input.customerId);
  if (!customer) throw new Error("Customer not found for this organization.");
  const org = await store.getOrganization(orgId);
  if (!org) throw new Error("Organization not found.");
  const journeys = await store.listJourneys(orgId);
  const occurredAt = input.occurredAt ?? nowIso();

  const event = await store.createCustomerEvent(orgId, {
    id: newId(),
    organizationId: orgId,
    customerId: customer.id,
    type: input.type,
    payload: input.payload,
    occurredAt,
    createdAt: nowIso(),
  });

  const exits = await applyExits(
    store,
    orgId,
    journeys,
    customer,
    input.type,
    input.payload,
  );
  const triggered = journeys.filter(
    (j) => j.triggerEvent === input.type && j.status === "active",
  );
  const outcomes: LifecycleOutcome[] = [...exits];

  for (const journey of triggered) {
    const condition = conditionFor(journey, customer, input.payload, new Date(occurredAt));
    if (!condition.eligible) {
      const enrollment = await createSuppressedEnrollment(
        store,
        orgId,
        journey,
        customer,
        condition.reason,
        dedupeKeyFor(journey, customer, input.payload),
      );
      await recordOutcome(
        store,
        orgId,
        journey,
        customer,
        input.type,
        input.payload,
        "suppressed",
        condition.reason,
        enrollment.id,
      );
      await audit(store, {
        organizationId: orgId,
        actor: "Lifecycle engine",
        action: "journey.suppressed",
        entityType: "journey_enrollment",
        entityId: enrollment.id,
        detail: {
          journey: journey.key,
          reason: condition.reason,
          customerId: customer.id,
        },
      });
      outcomes.push({
        journeyKey: journey.key,
        journeyName: journey.name,
        status: "suppressed",
        detail: condition.reason,
        enrollmentId: enrollment.id,
        deliveryId: null,
      });
      continue;
    }
    outcomes.push(
      await enroll(
        store,
        orgId,
        org,
        journey,
        customer,
        input.type,
        input.payload,
        condition.reason,
      ),
    );
  }

  return {
    eventId: event.id,
    eventType: input.type,
    customerId: customer.id,
    outcomes,
  };
}

export async function emitInactivityEvents(
  store: Store,
  orgId: string,
  now = new Date(),
): Promise<{ scanned: number; emitted: number; results: LifecycleResult[] }> {
  const customers = await store.listCustomers(orgId);
  const existingEvents = await store.listCustomerEvents(orgId);
  const results: LifecycleResult[] = [];
  let emitted = 0;
  for (const customer of customers) {
    if (!customer.draftEventName) continue;
    if (daysBetween(now, customer.lastActiveAt) < 7) continue;
    const recent = existingEvents.find(
      (e) =>
        e.customerId === customer.id &&
        e.type === "user.inactive" &&
        Math.abs(new Date(e.occurredAt).getTime() - now.getTime()) < 20 * 3_600_000,
    );
    if (recent) continue;
    const result = await processLifecycleEvent(store, orgId, {
      type: "user.inactive",
      customerId: customer.id,
      payload: {
        source: "cron",
        inactiveDays: Math.floor(daysBetween(now, customer.lastActiveAt)),
        draftName: customer.draftEventName,
      },
      occurredAt: now.toISOString(),
    });
    emitted += 1;
    results.push(result);
  }
  return { scanned: customers.length, emitted, results };
}

export type JourneyTestLabel = "previewed" | "sent" | "failed" | "suppressed";

export async function testJourney(
  store: Store,
  orgId: string,
  journeyId: string,
): Promise<{
  journeyKey: string;
  journeyName: string;
  result: JourneyTestLabel;
  detail: string;
  subject: string | null;
  text: string | null;
  html: string | null;
  preheader: string | null;
  provider: string | null;
  deliveryId: string | null;
  customerName: string;
}> {
  const journey = await store.getJourney(orgId, journeyId);
  if (!journey) throw new Error("Journey not found.");
  if (journey.status !== "active") {
    return {
      journeyKey: journey.key,
      journeyName: journey.name,
      result: "failed",
      detail: "Journey is paused. Activate it before testing.",
      subject: null,
      text: null,
      html: null,
      preheader: null,
      provider: null,
      deliveryId: null,
      customerName: "Reviewer sample",
    };
  }

  const now = new Date();
  const nowIsoValue = now.toISOString();
  const eightDaysAgo = new Date(now.getTime() - 8 * 86_400_000).toISOString();
  const periodEnd = new Date(now.getTime() + 10 * 86_400_000).toISOString();
  const customerId = newId();
  const customer: Customer = {
    id: customerId,
    organizationId: orgId,
    name: "Reviewer Sample",
    email: `reviewer-${customerId.slice(0, 8)}@demo.proofdesk.local`,
    club: `Reviewer Hack Club ${customerId.slice(0, 8)}`,
    role: "owner",
    plan: "pro",
    billingStatus: journey.key === "offboarding" ? "cancelled" : "active",
    periodEnd,
    workspaceCreatedAt: nowIsoValue,
    lastActiveAt: journey.key === "inactivity-nudge" ? eightDaysAgo : nowIsoValue,
    draftEventName: "Design Summit draft",
    draftUpdatedAt: eightDaysAgo,
    upcomingEventName: "Design Summit 2026",
    upcomingEventDate: new Date(now.getTime() + 21 * 86_400_000).toISOString(),
    emailOptOut: false,
    createdAt: nowIsoValue,
    updatedAt: nowIsoValue,
  };
  await store.createCustomer(orgId, customer);

  const payload: Record<string, unknown> = { source: "test-journey" };
  if (journey.key === "welcome") payload.workspaceOwner = true;
  if (journey.key === "offline-checkin") payload.release = "offline-checkin-v1";
  if (journey.key === "offboarding") payload.billingStatus = "cancelled";

  const processed = await processLifecycleEvent(store, orgId, {
    type: journey.triggerEvent as LifecycleEventType,
    customerId: customer.id,
    payload,
  });
  const outcome =
    processed.outcomes.find((item) => item.journeyKey === journey.key) ??
    processed.outcomes[0];
  const deliveries = await store.listDeliveries(orgId);
  const delivery = outcome?.deliveryId
    ? deliveries.find((item) => item.id === outcome.deliveryId) ?? null
    : null;

  let result: JourneyTestLabel = "failed";
  if (outcome?.status === "suppressed" || delivery?.status === "suppressed") {
    result = "suppressed";
  } else if (delivery?.status === "sent") {
    result = "sent";
  } else if (delivery?.status === "failed") {
    result = "failed";
  } else if (delivery && (delivery.status === "previewed" || delivery.status === "queued")) {
    result = "previewed";
  } else if (outcome?.status === "error") {
    result = "failed";
  }

  return {
    journeyKey: journey.key,
    journeyName: journey.name,
    result,
    detail: outcome?.detail ?? "The journey did not produce an outcome.",
    subject: delivery?.subject ?? null,
    text: delivery?.text ?? null,
    html: delivery?.html ?? null,
    preheader: delivery?.preheader ?? null,
    provider: delivery?.provider ?? null,
    deliveryId: delivery?.id ?? null,
    customerName: customer.name,
  };
}

export async function sendDeliveryNow(
  store: Store,
  orgId: string,
  deliveryId: string,
): Promise<Delivery> {
  const deliveries = await store.listDeliveries(orgId);
  const delivery = deliveries.find((d) => d.id === deliveryId);
  if (!delivery) throw new Error("Delivery not found.");
  if (delivery.status === "sent") return delivery;
  if (delivery.status === "suppressed") {
    throw new Error("Suppressed deliveries cannot be sent. The customer opted out or the journey exited.");
  }
  if (delivery.attempts >= 3) {
    throw new Error("Retry budget exhausted. Create a new delivery after fixing the provider.");
  }
  await store.updateDelivery(orgId, delivery.id, {
    status: "queued",
    attempts: delivery.attempts + 1,
  });
  const { attemptDelivery } = await import("./render");
  const attempt = await attemptDelivery({ ...delivery, attempts: delivery.attempts + 1 });
  const updated = await store.updateDelivery(orgId, delivery.id, {
    status: attempt.status,
    provider: attempt.provider,
    error: attempt.error,
    sentAt: attempt.sentAt,
    attempts: delivery.attempts + 1,
  });
  await audit(store, {
    organizationId: orgId,
    actor: "Lifecycle operator",
    action: `delivery.${attempt.status}`,
    entityType: "delivery",
    entityId: delivery.id,
    detail: {
      provider: attempt.provider,
      attempts: delivery.attempts + 1,
      error: attempt.error,
    },
  });
  return updated ?? delivery;
}

export async function queueDelivery(
  store: Store,
  orgId: string,
  deliveryId: string,
): Promise<Delivery> {
  const deliveries = await store.listDeliveries(orgId);
  const delivery = deliveries.find((d) => d.id === deliveryId);
  if (!delivery) throw new Error("Delivery not found.");
  if (delivery.status === "suppressed" || delivery.status === "sent") {
    throw new Error("Only previewed or failed deliveries can be queued.");
  }
  const updated = await store.updateDelivery(orgId, delivery.id, {
    status: "queued",
    scheduledFor: new Date(Date.now() + 5 * 60_000).toISOString(),
    error: null,
  });
  return updated ?? delivery;
}
