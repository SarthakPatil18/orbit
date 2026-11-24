import Link from "next/link";
import type { Decision, Risk, ConversationStatus, DeliveryStatus } from "@/lib/types";

export function OrbitMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.4" fill="currentColor" />
      <ellipse
        cx="12"
        cy="12"
        rx="10.4"
        ry="4.6"
        stroke="currentColor"
        strokeWidth="1.3"
        transform="rotate(-28 12 12)"
      />
      <circle cx="20.2" cy="7.1" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-full bg-ink text-paper">
        <OrbitMark size={19} />
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.02em]">Orbit</span>
      {!compact ? (
        <span className="mono hidden rounded border border-line px-1.5 py-0.5 text-[12px] uppercase tracking-[0.08em] text-muted sm:inline">
          ProofDesk
        </span>
      ) : null}
    </span>
  );
}

const decisionStyles: Record<Decision, string> = {
  answer: "border-forest/25 bg-forest-soft text-forest",
  clarify: "border-amber/25 bg-amber-soft text-amber",
  abstain: "border-line-strong bg-paper-2 text-ink-2",
  escalate: "border-rust/25 bg-rust-soft text-rust",
};

const decisionLabels: Record<Decision, string> = {
  answer: "Answered from evidence",
  clarify: "Clarifying",
  abstain: "Abstained",
  escalate: "Escalated to a person",
};

export function DecisionBadge({
  decision,
  short = false,
}: {
  decision: Decision;
  short?: boolean;
}) {
  return (
    <span className={`chip ${decisionStyles[decision]}`}>
      <span className="chip-dot" />
      {short ? decision : decisionLabels[decision]}
    </span>
  );
}

const riskStyles: Record<Risk, string> = {
  low: "border-forest/20 bg-forest-soft text-forest",
  medium: "border-amber/20 bg-amber-soft text-amber",
  high: "border-rust/25 bg-rust-soft text-rust",
};

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span className={`chip ${riskStyles[risk]}`}>
      {risk === "low" ? "Low risk" : risk === "medium" ? "Medium risk" : "High risk"}
    </span>
  );
}

const statusLabels: Record<ConversationStatus, string> = {
  ai_active: "AI active",
  needs_human: "Needs a person",
  human_owned: "Human owned",
  resolved: "Resolved",
};

const statusStyles: Record<ConversationStatus, string> = {
  ai_active: "border-sky/20 bg-sky-soft text-sky",
  needs_human: "border-rust/25 bg-rust-soft text-rust",
  human_owned: "border-forest/20 bg-forest-soft text-forest",
  resolved: "border-line-strong bg-paper-2 text-muted",
};

export function StatusBadge({ status }: { status: ConversationStatus }) {
  return (
    <span className={`chip ${statusStyles[status]}`}>
      <span className="chip-dot" />
      {statusLabels[status]}
    </span>
  );
}

export function statusLabel(status: ConversationStatus): string {
  return statusLabels[status];
}

const deliveryStyles: Record<DeliveryStatus, string> = {
  previewed: "border-amber/20 bg-amber-soft text-amber",
  queued: "border-sky/20 bg-sky-soft text-sky",
  sent: "border-forest/20 bg-forest-soft text-forest",
  failed: "border-rust/25 bg-rust-soft text-rust",
  suppressed: "border-line-strong bg-paper-2 text-muted",
};

export function DeliveryBadge({ status }: { status: DeliveryStatus }) {
  return <span className={`chip ${deliveryStyles[status]}`}>{status}</span>;
}

export function LiveDot({ tone = "forest" }: { tone?: "forest" | "rust" | "amber" }) {
  const color =
    tone === "rust" ? "bg-rust" : tone === "amber" ? "bg-amber" : "bg-forest";
  return (
    <span className="relative flex size-2">
      <span
        className={`absolute inline-flex size-full animate-ping rounded-full ${color} opacity-40`}
      />
      <span className={`relative inline-flex size-2 rounded-full ${color}`} />
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display mt-3 text-balance text-[34px] leading-[1.03] sm:text-[44px]">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted">
          {body}
        </p>
      ) : null}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mono inline-flex min-h-10 items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink"
    >
      <span aria-hidden="true">←</span>
      {children}
    </Link>
  );
}

export function Metric({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="display text-[30px] leading-none tracking-[-0.02em] sm:text-[36px]">
        {value}
      </div>
      <div className="mt-2 text-[12.5px] font-medium text-ink-2">{label}</div>
      {hint ? <div className="mt-0.5 text-[11.5px] text-muted">{hint}</div> : null}
    </div>
  );
}
