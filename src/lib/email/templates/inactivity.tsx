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

export function InactivityEmail(props: LifecycleEmailProps) {
  return (
    <EmailLayout
      preheader={props.preheader}
      workspaceName={props.workspaceName}
      unsubscribeUrl={props.unsubscribeUrl}
      footerNote={`You are receiving this because ${props.draftName} is saved in ${props.workspaceName}.`}
    >
      <EmailHeading>{props.draftName} is still saved</EmailHeading>
      <EmailParagraph>
        No guilt. A draft is just an idea with a date attached.
      </EmailParagraph>
      <EmailParagraph>
        When you have ten minutes, the name, venue, and ticket details you
        already wrote will be waiting. Orbit autosaves the rest.
      </EmailParagraph>
      <EmailPanel>
        <EmailPanelLabel>Pick up where you left off</EmailPanelLabel>
        <EmailList
          items={[
            "Open the draft — everything is where you left it.",
            "Check the date and venue against your committee calendar.",
            "Publish when the checklist is green, or leave it for later.",
          ]}
        />
      </EmailPanel>
      <EmailButton href={props.primaryActionUrl}>
        Continue {props.draftName}
      </EmailButton>
      <EmailParagraph>
        If the event isn&apos;t happening, that&apos;s a fine answer too. Delete
        the draft in one click and we&apos;ll stop reminding you.
      </EmailParagraph>
      <EmailSignoff />
    </EmailLayout>
  );
}

export function inactivityText(props: LifecycleEmailProps): string {
  return [
    `${props.draftName} is still saved`,
    "",
    "No guilt. A draft is just an idea with a date attached.",
    "",
    "When you have ten minutes, the name, venue, and ticket details you already wrote will be waiting. Orbit autosaves the rest.",
    "",
    "PICK UP WHERE YOU LEFT OFF",
    "- Open the draft — everything is where you left it.",
    "- Check the date and venue against your committee calendar.",
    "- Publish when the checklist is green, or leave it for later.",
    "",
    `Continue ${props.draftName}: ${props.primaryActionUrl}`,
    "",
    "If the event isn't happening, that's a fine answer too. Delete the draft in one click and we'll stop reminding you.",
    "",
    "Asha",
    "Support lead, Orbit",
    "",
    "---",
    `You are receiving this because ${props.draftName} is saved in ${props.workspaceName}.`,
    `Email preferences: ${props.unsubscribeUrl}`,
    "Reply to a person: support@orbit.club",
    "Orbit · Bengaluru, India · orbit.club",
  ].join("\n");
}
