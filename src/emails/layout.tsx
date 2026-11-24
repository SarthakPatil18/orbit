import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const colors = {
  ink: "#111411",
  inkSoft: "#242823",
  paper: "#f4f2ec",
  surface: "#fffdf8",
  line: "#d7d2c5",
  muted: "#5f645d",
  signal: "#d8ee86",
  verified: "#27523c",
};

export interface EmailLayoutProps {
  preheader: string;
  workspaceName: string;
  unsubscribeUrl: string;
  children: ReactNode;
  footerNote?: string;
  billingNote?: boolean;
}

export function EmailLayout({
  preheader,
  workspaceName,
  unsubscribeUrl,
  children,
  footerNote,
  billingNote,
}: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandRow}>
            <div style={mark}>
              <div style={markDot} />
            </div>
            <Text style={wordmark}>ORBIT</Text>
            <Text style={brandMeta}>CAMPUS EVENTS, HANDLED</Text>
          </Section>
          <div style={signalBar} />
          <Section style={content}>{children}</Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerCopy}>
              {footerNote ??
                `You are receiving this because you run ${workspaceName} on Orbit.`}
            </Text>
            {billingNote ? (
              <Text style={footerCopy}>
                This is a service message about your Orbit account and plan.
              </Text>
            ) : null}
            <Text style={footerLinks}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Email preferences
              </Link>
              <span style={footerDivider}> · </span>
              <Link href="mailto:support@orbit.club" style={footerLink}>
                Reply to a person
              </Link>
            </Text>
            <Text style={footerMeta}>
              Orbit · Bengaluru, India · orbit.club
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailHeading({ children }: { children: ReactNode }) {
  return <Text style={heading}>{children}</Text>;
}

export function EmailParagraph({ children }: { children: ReactNode }) {
  return <Text style={paragraph}>{children}</Text>;
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={{ margin: "26px 0 8px" }}>
      <Link href={href} style={button}>
        {children}
      </Link>
    </Section>
  );
}

export function EmailPanel({ children }: { children: ReactNode }) {
  return <Section style={panel}>{children}</Section>;
}

export function EmailPanelLabel({ children }: { children: ReactNode }) {
  return <Text style={panelLabel}>{children}</Text>;
}

export function EmailList({ items }: { items: string[] }) {
  return (
    <Section style={{ margin: "10px 0 0" }}>
      {items.map((item) => (
        <Text key={item} style={listItem}>
          <span style={bullet}>→</span> {item}
        </Text>
      ))}
    </Section>
  );
}

export function EmailSignoff() {
  return (
    <Text style={signoff}>
      Asha
      <br />
      <span style={signoffRole}>Support lead, Orbit</span>
    </Text>
  );
}

const body: React.CSSProperties = {
  backgroundColor: colors.paper,
  margin: 0,
  padding: "28px 12px 40px",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif",
  color: colors.ink,
};

const container: React.CSSProperties = {
  width: "100%",
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: colors.surface,
  border: `1px solid ${colors.line}`,
  borderRadius: "12px",
  overflow: "hidden",
};

const brandRow: React.CSSProperties = {
  padding: "20px 28px 16px",
  display: "flex",
};

const mark: React.CSSProperties = {
  display: "inline-block",
  width: "18px",
  height: "18px",
  borderRadius: "4px",
  backgroundColor: colors.ink,
  position: "relative",
  marginRight: "8px",
  verticalAlign: "middle",
};

const markDot: React.CSSProperties = {
  position: "absolute",
  right: "3px",
  bottom: "3px",
  width: "5px",
  height: "5px",
  borderRadius: "1px",
  backgroundColor: colors.signal,
};

const wordmark: React.CSSProperties = {
  display: "inline-block",
  margin: 0,
  fontFamily: "Georgia, 'Iowan Old Style', Palatino, serif",
  fontSize: "16px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  verticalAlign: "middle",
};

const brandMeta: React.CSSProperties = {
  margin: "0 0 0 12px",
  display: "inline-block",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "12px",
  letterSpacing: "0.12em",
  color: colors.muted,
  verticalAlign: "middle",
};

const signalBar: React.CSSProperties = {
  height: "4px",
  backgroundColor: colors.signal,
};

const content: React.CSSProperties = {
  padding: "32px 28px 8px",
};

const heading: React.CSSProperties = {
  margin: "0 0 18px",
  fontFamily: "Georgia, 'Iowan Old Style', Palatino, serif",
  fontSize: "28px",
  lineHeight: "34px",
  letterSpacing: "-0.02em",
  fontWeight: 700,
  color: colors.ink,
};

const paragraph: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "15px",
  lineHeight: "24px",
  color: colors.inkSoft,
};

const button: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: colors.ink,
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: "7px",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
};

const panel: React.CSSProperties = {
  backgroundColor: colors.paper,
  border: `1px solid ${colors.line}`,
  borderRadius: "8px",
  padding: "16px 18px",
  margin: "18px 0",
};

const panelLabel: React.CSSProperties = {
  margin: "0 0 8px",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "12px",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.muted,
};

const listItem: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "14px",
  lineHeight: "21px",
  color: colors.inkSoft,
};

const bullet: React.CSSProperties = {
  color: colors.verified,
  fontWeight: 700,
};

const signoff: React.CSSProperties = {
  margin: "26px 0 10px",
  fontSize: "14px",
  lineHeight: "21px",
  color: colors.ink,
  fontWeight: 600,
};

const signoffRole: React.CSSProperties = {
  color: colors.muted,
  fontWeight: 400,
};

const hr: React.CSSProperties = {
  borderColor: colors.line,
  margin: "26px 28px 0",
};

const footer: React.CSSProperties = {
  padding: "16px 28px 24px",
};

const footerCopy: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "11.5px",
  lineHeight: "17px",
  color: colors.muted,
};

const footerLinks: React.CSSProperties = {
  margin: "10px 0 8px",
  fontSize: "11.5px",
  lineHeight: "17px",
  color: colors.muted,
};

const footerLink: React.CSSProperties = {
  color: colors.inkSoft,
  textDecoration: "underline",
};

const footerDivider: React.CSSProperties = {
  color: colors.line,
};

const footerMeta: React.CSSProperties = {
  margin: "0",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "12px",
  letterSpacing: "0.04em",
  color: colors.muted,
};
