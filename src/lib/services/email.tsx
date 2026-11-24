import { render } from "@react-email/render";
import type { Customer, Delivery, Journey, Organization } from "@/lib/types";
import { getRuntimeConfig } from "@/lib/env";
import { FeatureUpdateEmail, featureUpdateText } from "@/emails/feature-update";
import { InactivityEmail, inactivityText } from "@/emails/inactivity";
import { OffboardingEmail, offboardingText } from "@/emails/offboarding";
import { WelcomeEmail, welcomeText } from "@/emails/welcome";
import type { LifecycleEmailProps } from "@/emails/welcome";

export interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
  mergeFields: Record<string, string>;
}

export function formatPeriodEnd(value: string | null): string {
  if (!value) return "the end of your billing period";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function clean(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function mergeFieldsFor(
  journey: Journey,
  customer: Customer,
  organization: Organization,
  appUrl: string,
): Record<string, string> {
  const base = appUrl.replace(/\/$/, "");
  const campaign =
    journey.emailKind === "feature-update" ? "offline-checkin" : journey.key;
  return {
    first_name: clean(customer.name.split(/\s+/)[0] ?? customer.name),
    draft_name: clean(customer.draftEventName ?? "your event draft"),
    period_end: formatPeriodEnd(customer.periodEnd ?? organization.periodEnd),
    event_name: clean(customer.upcomingEventName ?? "your next event"),
    workspace_name: clean(customer.club),
    primary_action_url: `${base}/?utm_source=email&utm_campaign=${encodeURIComponent(
      campaign,
    )}#get-started`,
    unsubscribe_url: `${base}/?preferences=${encodeURIComponent(
      customer.email,
    )}#email-preferences`,
  };
}

export function mergeTemplate(template: string, fields: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_match, key: string) => {
    return fields[key] ?? "";
  });
}

function assertNoPlaceholders(value: string, label: string): void {
  const leftover = value.match(/\{\{[^}]+\}\}/g);
  if (leftover) {
    throw new Error(
      `Unresolved merge field in ${label}: ${leftover.join(", ")}. Add the value to mergeFieldsFor().`,
    );
  }
}

export async function renderLifecycleEmail(args: {
  journey: Journey;
  customer: Customer;
  organization: Organization;
  appUrl?: string;
}): Promise<RenderedEmail> {
  const { journey, customer, organization } = args;
  const appUrl = args.appUrl ?? getRuntimeConfig().appUrl;
  const fields = mergeFieldsFor(journey, customer, organization, appUrl);
  const subject = mergeTemplate(journey.subject, fields);
  const preheader = mergeTemplate(journey.preheader, fields);
  assertNoPlaceholders(subject, "subject");
  assertNoPlaceholders(preheader, "preheader");

  const props: LifecycleEmailProps = {
    firstName: fields.first_name ?? "",
    workspaceName: fields.workspace_name ?? "",
    draftName: fields.draft_name ?? "",
    eventName: fields.event_name ?? "",
    periodEnd: fields.period_end ?? "",
    primaryActionUrl: fields.primary_action_url ?? appUrl,
    unsubscribeUrl: fields.unsubscribe_url ?? appUrl,
    preheader,
  };

  let html: string;
  let text: string;
  switch (journey.emailKind) {
    case "welcome":
      html = await render(<WelcomeEmail {...props} />);
      text = welcomeText(props);
      break;
    case "inactivity":
      html = await render(<InactivityEmail {...props} />);
      text = inactivityText(props);
      break;
    case "feature-update":
      html = await render(<FeatureUpdateEmail {...props} />);
      text = featureUpdateText(props);
      break;
    case "offboarding":
      html = await render(<OffboardingEmail {...props} />);
      text = offboardingText(props);
      break;
  }

  assertNoPlaceholders(html, "HTML");
  assertNoPlaceholders(text, "plain text");
  return { subject, preheader, html, text, mergeFields: fields };
}

export async function sampleJourneyCopy(
  journey: Journey,
  organization: Organization,
): Promise<RenderedEmail> {
  const now = new Date();
  const past = new Date(now.getTime() - 8 * 86_400_000).toISOString();
  const ahead = new Date(now.getTime() + 10 * 86_400_000).toISOString();
  const customer: Customer = {
    id: "sample-reviewer",
    organizationId: organization.id,
    name: "Ishita Shah",
    email: "ishita@demo.proofdesk.local",
    club: "Design Collective",
    role: "owner",
    plan: "pro",
    billingStatus: journey.key === "offboarding" ? "cancelled" : "active",
    periodEnd: ahead,
    workspaceCreatedAt: now.toISOString(),
    lastActiveAt: journey.key === "inactivity-nudge" ? past : now.toISOString(),
    draftEventName: "Design Summit draft",
    draftUpdatedAt: past,
    upcomingEventName: "Design Summit 2026",
    upcomingEventDate: ahead,
    emailOptOut: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  return renderLifecycleEmail({ journey, customer, organization });
}

export interface DeliveryAttempt {
  status: "sent" | "previewed" | "failed" | "suppressed";
  provider: string;
  error: string | null;
  sentAt: string | null;
}

export function canSendTo(recipient: string): { allowed: boolean; reason?: string } {
  const config = getRuntimeConfig();
  if (config.demoMode) {
    return { allowed: true };
  }
  if (!config.hasResendKey) {
    return {
      allowed: false,
      reason:
        "RESEND_API_KEY is not configured. The delivery stays in the preview sink.",
    };
  }
  if (!config.demoEmailTo) {
    return {
      allowed: false,
      reason:
        "DEMO_EMAIL_TO is empty. Real email is blocked until an allowlisted recipient is configured.",
    };
  }
  if (recipient.toLowerCase() !== config.demoEmailTo.toLowerCase()) {
    return {
      allowed: false,
      reason: `Recipient is not on the demo allowlist. Only ${config.demoEmailTo} can receive real email.`,
    };
  }
  return { allowed: true };
}

export async function attemptDelivery(
  delivery: Delivery,
): Promise<DeliveryAttempt> {
  const config = getRuntimeConfig();
  if (config.demoMode) {
    return {
      status: "previewed",
      provider: "demo-sink",
      error: null,
      sentAt: null,
    };
  }

  const allow = canSendTo(delivery.recipient);
  if (!allow.allowed) {
    return {
      status: "failed",
      provider: "blocked",
      error: allow.reason ?? "Delivery blocked by demo policy.",
      sentAt: null,
    };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: config.emailFrom,
      to: [delivery.recipient],
      subject: delivery.subject,
      html: delivery.html,
      text: delivery.text,
    });
    if (result.error) {
      return {
        status: "failed",
        provider: "resend",
        error: result.error.message,
        sentAt: null,
      };
    }
    return {
      status: "sent",
      provider: "resend",
      error: null,
      sentAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "failed",
      provider: "resend",
      error: error instanceof Error ? error.message : "Unknown provider error",
      sentAt: null,
    };
  }
}
