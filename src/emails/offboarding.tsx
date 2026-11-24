import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
  EmailPanel,
  EmailPanelLabel,
  EmailSignoff,
} from "./layout";
import type { ReactNode } from "react";
import type { LifecycleEmailProps } from "./welcome";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ margin: "0 0 12px" }}>
      <span
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "12px",
          letterSpacing: "0.08em",
          color: "#5f645d",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div style={{ fontSize: "14px", lineHeight: "21px", color: "#27272a" }}>
        {children}
      </div>
    </div>
  );
}

export function OffboardingEmail(props: LifecycleEmailProps) {
  return (
    <EmailLayout
      preheader={props.preheader}
      workspaceName={props.workspaceName}
      unsubscribeUrl={props.unsubscribeUrl}
      billingNote
      footerNote={`This cancellation notice is for ${props.workspaceName}.`}
    >
      <EmailHeading>
        Here&apos;s exactly what changes on {props.periodEnd}.
      </EmailHeading>
      <EmailParagraph>
        Your cancellation is verified. Pro stays active until{" "}
        {props.periodEnd}. After that, {props.workspaceName} moves to Free. No
        further charges will be made.
      </EmailParagraph>
      <EmailPanel>
        <EmailPanelLabel>The full picture</EmailPanelLabel>
        <Row label="What stays">
          Every event, registration, attendee record, announcement, and CSV
          export you already have.
        </Row>
        <Row label="What changes">
          The workspace moves to Free: one active event, no paid registration,
          and no offline check-in. Online check-in and email announcements
          remain.
        </Row>
        <Row label="Billing">
          No prorated refund is issued for the unused part of the period. Your
          final receipt stays available under Settings → Billing.
        </Row>
        <Row label="Your data">
          Orbit keeps workspace data for 90 days after the downgrade, then
          follows the deletion schedule. Export anything you need before then.
        </Row>
        <Row label="Coming back">
          Reactivate Pro within 90 days and your history returns with it. No
          re-import, no rebuild.
        </Row>
      </EmailPanel>
      <EmailButton href={props.primaryActionUrl}>
        Review your billing options
      </EmailButton>
      <EmailParagraph>
        If anything here doesn&apos;t match your billing page, reply and a person
        will check it. No jokes about money.
      </EmailParagraph>
      <EmailSignoff />
    </EmailLayout>
  );
}

export function offboardingText(props: LifecycleEmailProps): string {
  return [
    `Here's exactly what changes on ${props.periodEnd}.`,
    "",
    `Your cancellation is verified. Pro stays active until ${props.periodEnd}. After that, ${props.workspaceName} moves to Free. No further charges will be made.`,
    "",
    "WHAT STAYS",
    "Every event, registration, attendee record, announcement, and CSV export you already have.",
    "",
    "WHAT CHANGES",
    "The workspace moves to Free: one active event, no paid registration, and no offline check-in. Online check-in and email announcements remain.",
    "",
    "BILLING",
    "No prorated refund is issued for the unused part of the period. Your final receipt stays available under Settings → Billing.",
    "",
    "YOUR DATA",
    "Orbit keeps workspace data for 90 days after the downgrade, then follows the deletion schedule. Export anything you need before then.",
    "",
    "COMING BACK",
    "Reactivate Pro within 90 days and your history returns with it. No re-import, no rebuild.",
    "",
    `Review your billing options: ${props.primaryActionUrl}`,
    "",
    "If anything here doesn't match your billing page, reply and a person will check it. No jokes about money.",
    "",
    "Asha",
    "Support lead, Orbit",
    "",
    "---",
    `This cancellation notice is for ${props.workspaceName}.`,
    "This is a service message about your Orbit account and plan.",
    `Email preferences: ${props.unsubscribeUrl}`,
    "Reply to a person: support@orbit.club",
    "Orbit · Bengaluru, India · orbit.club",
  ].join("\n");
}
