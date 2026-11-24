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

export interface LifecycleEmailProps {
  firstName: string;
  workspaceName: string;
  draftName: string;
  eventName: string;
  periodEnd: string;
  primaryActionUrl: string;
  unsubscribeUrl: string;
  preheader: string;
}

export function WelcomeEmail(props: LifecycleEmailProps) {
  return (
    <EmailLayout
      preheader={props.preheader}
      workspaceName={props.workspaceName}
      unsubscribeUrl={props.unsubscribeUrl}
      footerNote={`You are receiving this because you created ${props.workspaceName} on Orbit.`}
    >
      <EmailHeading>Your club has a new home, {props.firstName}</EmailHeading>
      <EmailParagraph>
        You&apos;ve got a workspace, a committee inbox, and one clean place to
        run your next event. No spreadsheet archaeology required.
      </EmailParagraph>
      <EmailParagraph>
        The first step is the only one that matters today: create an event.
        Orbit builds the registration page, confirmation email, attendee list,
        and QR check-in list from the details you already know.
      </EmailParagraph>
      <EmailPanel>
        <EmailPanelLabel>The first 10 minutes</EmailPanelLabel>
        <EmailList
          items={[
            "Create your event and save it as a draft.",
            "Invite your committee with owner, manager, or volunteer roles.",
            "Publish when the checklist is green — Orbit handles the rest.",
          ]}
        />
      </EmailPanel>
      <EmailButton href={props.primaryActionUrl}>
        Create your first event
      </EmailButton>
      <EmailParagraph>
        If you&apos;d rather look around first, reply to this email. A person
        reads it.
      </EmailParagraph>
      <EmailSignoff />
    </EmailLayout>
  );
}

export function welcomeText(props: LifecycleEmailProps): string {
  return [
    `Your club has a new home, ${props.firstName}`,
    "",
    "You've got a workspace, a committee inbox, and one clean place to run your next event. No spreadsheet archaeology required.",
    "",
    "The first step is the only one that matters today: create an event. Orbit builds the registration page, confirmation email, attendee list, and QR check-in list from the details you already know.",
    "",
    "THE FIRST 10 MINUTES",
    "- Create your event and save it as a draft.",
    "- Invite your committee with owner, manager, or volunteer roles.",
    "- Publish when the checklist is green — Orbit handles the rest.",
    "",
    `Create your first event: ${props.primaryActionUrl}`,
    "",
    "If you'd rather look around first, reply to this email. A person reads it.",
    "",
    "Asha",
    "Support lead, Orbit",
    "",
    "---",
    `You are receiving this because you created ${props.workspaceName} on Orbit.`,
    `Email preferences: ${props.unsubscribeUrl}`,
    "Reply to a person: support@orbit.club",
    "Orbit · Bengaluru, India · orbit.club",
  ].join("\n");
}
