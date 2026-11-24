import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailList,
  EmailPanel,
  EmailPanelLabel,
  EmailParagraph,
  EmailSignoff,
} from "./layout";
import type { LifecycleEmailProps } from "./welcome";

export function FeatureUpdateEmail(props: LifecycleEmailProps) {
  return (
    <EmailLayout
      preheader={props.preheader}
      workspaceName={props.workspaceName}
      unsubscribeUrl={props.unsubscribeUrl}
      footerNote={`You are receiving this because ${props.workspaceName} has an upcoming event and is on Orbit Pro. This release note is sent once per workspace per version.`}
    >
      <EmailHeading>Bad wifi shouldn&apos;t stop the door.</EmailHeading>
      <EmailParagraph>
        Offline check-in is live for {props.eventName}. Download the attendee
        list before doors, scan up to 500 tickets without a connection, and sync
        when you&apos;re back online.
      </EmailParagraph>
      <EmailPanel>
        <EmailPanelLabel>Before the doors open</EmailPanelLabel>
        <EmailList
          items={[
            "Prepare one scanning device per door while it still has a connection.",
            "Keep the device online until the status reads Ready offline.",
            "Sync after the event and review any conflicting scans.",
          ]}
        />
      </EmailPanel>
      <EmailButton href={props.primaryActionUrl}>
        Prepare offline check-in
      </EmailButton>
      <EmailParagraph>
        If your event is more than a month away, prepare the device the week of
        the event so the attendee list is current.
      </EmailParagraph>
      <EmailSignoff />
    </EmailLayout>
  );
}

export function featureUpdateText(props: LifecycleEmailProps): string {
  return [
    "Bad wifi shouldn't stop the door.",
    "",
    `Offline check-in is live for ${props.eventName}. Download the attendee list before doors, scan up to 500 tickets without a connection, and sync when you're back online.`,
    "",
    "BEFORE THE DOORS OPEN",
    "- Prepare one scanning device per door while it still has a connection.",
    "- Keep the device online until the status reads Ready offline.",
    "- Sync after the event and review any conflicting scans.",
    "",
    `Prepare offline check-in: ${props.primaryActionUrl}`,
    "",
    "If your event is more than a month away, prepare the device the week of the event so the attendee list is current.",
    "",
    "Asha",
    "Support lead, Orbit",
    "",
    "---",
    `You are receiving this because ${props.workspaceName} has an upcoming event and is on Orbit Pro. This release note is sent once per workspace per version.`,
    `Email preferences: ${props.unsubscribeUrl}`,
    "Reply to a person: support@orbit.club",
    "Orbit · Bengaluru, India · orbit.club",
  ].join("\n");
}
