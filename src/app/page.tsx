import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  Handshake,
  Mail,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { getStore } from "@/lib/store";
import { orgId } from "@/lib/api/http";
import { ChatWidget } from "@/components/chat-widget";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { DecisionBadge, LiveDot, RiskBadge, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await getStore();
  const org = orgId();
  const [sources, cases, journeys, customers, conversations] = await Promise.all([
    store.listSources(org),
    store.listEvalCases(org),
    store.listJourneys(org),
    store.listCustomers(org),
    store.listConversations(org),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-line lg:flex lg:min-h-[calc(100svh-62px)] lg:items-center">
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.35]" />
          <div className="page-shell relative grid gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
            <div className="animate-rise">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5">
                <LiveDot />
                <span className="mono text-[12px] uppercase leading-snug tracking-[0.04em] text-muted sm:tracking-[0.12em]">
                  <span className="sm:hidden">
                    Orbit 2027
                    <br />
                    campus event operations
                  </span>
                  <span className="hidden sm:inline">
                    Orbit 2027 · campus event operations
                  </span>
                </span>
              </div>
              <h1 className="display mt-6 text-[52px] leading-[0.96] sm:text-[72px] lg:text-[80px]">
                Every campus
                <br />
                event, run
                <br />
                <span className="italic text-forest">properly.</span>
              </h1>
              <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-muted">
                Orbit gives clubs one place to publish events, sell tickets,
                announce changes, and check people in — even when the campus
                Wi-Fi isn&apos;t cooperating.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/desk" className="btn btn-primary w-full !px-5 !py-3 sm:w-auto">
                  Open the support desk
                  <ArrowRight size={16} />
                </Link>
                <Link href="/trust" className="btn w-full !px-5 !py-3 sm:w-auto">
                  <ShieldCheck size={16} />
                  See the Trust Center
                </Link>
              </div>
              <div className="mt-10 flex flex-col gap-2 text-[12px] text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-forest" /> No credit card to
                  start
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-forest" /> Built for committees
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-forest" /> Support that cites
                  sources
                </span>
              </div>
            </div>

            <div className="animate-rise [animation-delay:120ms]">
              <EventConsole />
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-[#fffdf8]" aria-label="Prototype counts">
          <div className="page-shell">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                {
                  value: "4",
                  label: "Lifecycle journeys",
                  hint: "Welcome to offboarding",
                },
                {
                  value: String(sources.filter((s) => s.status === "active").length),
                  label: "Approved knowledge sources",
                  hint: "Versioned and owned",
                },
                {
                  value: String(cases.length),
                  label: "Golden evaluation cases",
                  hint: "Run live in the Trust Center",
                },
                {
                  value: String(customers.length),
                  label: "Synthetic workspaces",
                  hint: `${conversations.length} seeded support threads`,
                },
              ].map((stat, index) => (
                <div key={stat.label} className={statCellClass(index)}>
                  <Stat value={stat.value} label={stat.label} hint={stat.hint} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="product" className="page-shell">
          <div className="py-16 lg:py-24">
          <SectionHeading
            eyebrow="The product"
            title="One operating system for the whole event."
            body="Orbit is built around the way campus committees actually work: a shared committee inbox, a treasurer who needs clean exports, and a volunteer at the door with a phone that has 2% battery."
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <FeatureCard
              icon={<CalendarDays size={18} />}
              title="Publish and sell"
              body="Create the public page, ticket types, and settlement account in one flow. Paid events stay off until the refund policy and payout account are verified."
              visual={<PublishVisual />}
            />
            <FeatureCard
              icon={<QrCode size={18} />}
              title="Check in offline"
              body="Download the attendee list before doors open. Scan QR tickets without a network, then sync the scans when you're back online — with conflicts flagged, not silently overwritten."
              visual={<CheckinVisual />}
            />
            <FeatureCard
              icon={<BellRing size={18} />}
              title="Announce without chaos"
              body="Schedule a send, preview a test in your own inbox, and keep an audit trail of who changed the copy. One source of truth for the committee."
              visual={<AnnounceVisual />}
            />
          </div>
          </div>
        </section>

        <section className="border-y border-line bg-ink text-[#eef0e7]">
          <div className="page-shell grid gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
            <div>
              <p className="mono text-[12px] uppercase tracking-[0.14em] text-[#a9b3a3]">
                ProofDesk · Track 05
              </p>
              <h2 className="display mt-4 text-[40px] leading-[1.02] sm:text-[52px]">
                Support that can
                <br />
                prove it.
              </h2>
              <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-[#b9c0b3]">
                The policy engine — not the language model — chooses whether to
                answer, clarify, abstain, or escalate. Every answer carries its
                evidence. Every sensitive request stops and finds a human.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/desk" className="btn btn-lime !px-5 !py-2.5">
                  Open the agent desk
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/trust"
                  className="btn !border-[#3b433a] !bg-transparent !px-5 !py-2.5 !text-[#eef0e7] hover:!bg-[#232a22]"
                >
                  Inspect the eval
                </Link>
              </div>
              <dl className="mt-10 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-[#2c332b] pt-6">
                <div>
                  <dt className="mono text-[12px] uppercase tracking-[0.12em] text-[#8f9a8a]">
                    Autonomy
                  </dt>
                  <dd className="mt-1 text-[13px]">
                    Evidence-conditioned, per turn
                  </dd>
                </div>
                <div>
                  <dt className="mono text-[12px] uppercase tracking-[0.12em] text-[#8f9a8a]">
                    Sensitive actions
                  </dt>
                  <dd className="mt-1 text-[13px]">Never executed in chat</dd>
                </div>
                <div>
                  <dt className="mono text-[12px] uppercase tracking-[0.12em] text-[#8f9a8a]">
                    Handoffs
                  </dt>
                  <dd className="mt-1 text-[13px]">No-repeat packet</dd>
                </div>
                <div>
                  <dt className="mono text-[12px] uppercase tracking-[0.12em] text-[#8f9a8a]">
                    Demo mode
                  </dt>
                  <dd className="mt-1 text-[13px]">No model key required</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-[#343c33] bg-[#1b211a] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <DecisionBadge decision="answer" />
                  <RiskBadge risk="low" />
                  <span className="mono text-[9px] uppercase tracking-[0.1em] text-[#8f9a8a]">
                    policy-2026.11.1
                  </span>
                </div>
                <p className="mt-4 text-[14px] leading-relaxed text-[#e8ebe3]">
                  Open Attendees → Export. Choose “Paid only”, then CSV. The
                  export includes ticket type, payment status, and the settlement
                  reference for each attendee.
                </p>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#35402f] bg-[#222b20] px-3 py-2.5">
                  <FileText size={14} className="mt-0.5 shrink-0 text-lime" />
                  <div className="text-[11.5px] leading-relaxed text-[#b9c5ad]">
                    <span className="font-semibold text-[#e8ebe3]">
                      Exporting attendees · v2.4
                    </span>
                    <br />
                    Finance team · effective 2026-08-19
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#4b342d] bg-[#2a1f1b] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <DecisionBadge decision="escalate" />
                  <span className="mono text-[9px] uppercase tracking-[0.1em] text-[#b79a8e]">
                    sensitive action blocked
                  </span>
                </div>
                <p className="mt-4 text-[13.5px] leading-relaxed text-[#ecdfd8]">
                  “I was charged twice for one Design Summit ticket.”
                </p>
                <div className="mt-3 grid gap-2 text-[11.5px] text-[#c9b3a9] sm:grid-cols-2">
                  <span className="flex items-center gap-1.5">
                    <Handshake size={12} /> Routed to Billing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} /> 2 sources attached
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={12} /> Full transcript
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={12} /> No refund executed
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#343c33] bg-[#1b211a] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <DecisionBadge decision="abstain" />
                  <span className="mono text-[9px] uppercase tracking-[0.1em] text-[#8f9a8a]">
                    unsupported · out of scope
                  </span>
                </div>
                <p className="mt-4 text-[13.5px] leading-relaxed text-[#e8ebe3]">
                  “Can Orbit reserve our auditorium for the cultural fest?”
                </p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-[#9ca795]">
                  No approved source. It says so instead of inventing a
                  capability — then offers a person.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="page-shell py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <SectionHeading
              eyebrow="Lifecycle"
              title="Four emails that know when to stop."
              body="Triggered by real product events, gated by conditions, deduped by entry limits, and suppressed by exits. Every send lands in the in-app sink unless a real recipient is explicitly allowlisted."
            />
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {journeys.map((journey) => (
                <span
                  key={journey.id}
                  className="chip !bg-white/70 !px-3 !py-1.5 !text-[11.5px]"
                >
                  <Mail size={12} className="text-forest" />
                  {journey.name}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <JourneyTeaser
              step="01"
              title="Welcome"
              trigger="user.created"
              copy="A new committee owner gets a workspace checklist, not a sales pitch."
              icon={<Sparkles size={16} />}
            />
            <JourneyTeaser
              step="02"
              title="Inactivity nudge"
              trigger="user.inactive · 7 days"
              copy="Only if a draft exists. Publishing, deleting, or snoozing exits the journey."
              icon={<CalendarDays size={16} />}
            />
            <JourneyTeaser
              step="03"
              title="Offline check-in"
              trigger="feature.released"
              copy="Release offline-checkin-v1. Scoped to workspaces with an upcoming event."
              icon={<ScanLine size={16} />}
            />
            <JourneyTeaser
              step="04"
              title="Offboarding"
              trigger="subscription.cancelled"
              copy="Verified billing state, plain-language export and deletion terms, no guilt."
              icon={<Wallet size={16} />}
            />
          </div>
          <div className="mt-8">
            <Link
              href="/journeys"
              className="mono inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.12em] text-forest hover:underline"
            >
              Open the lifecycle studio <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        <section className="border-t border-line bg-[#fffdf8]">
          <div className="page-shell grid gap-10 py-20 lg:grid-cols-3 lg:py-24">
            <div>
              <p className="eyebrow">Why this is different</p>
              <h2 className="display mt-3 text-[36px] leading-[1.04]">
                A support product,
                <br />
                not a chat demo.
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-muted">
                The interesting work is everything around the model: evidence
                thresholds, contradiction checks, stale-source refusal, handoff
                packets, evaluation gates, and an audit trail a support lead can
                defend.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              <Pillar
                icon={<ShieldCheck size={17} />}
                title="Policy owns the decision"
                body="A deterministic engine evaluates risk, sentiment, evidence strength, repetition, and missing information before generation."
              />
              <Pillar
                icon={<BadgeCheck size={17} />}
                title="Citations are verified"
                body="Every material claim maps to an approved source. If verification fails, the answer is withheld."
              />
              <Pillar
                icon={<Users size={17} />}
                title="Handoffs don't repeat work"
                body="Goal, transcript, sources, claims already made, missing details, and a recommended next action travel together."
              />
              <Pillar
                icon={<Ticket size={17} />}
                title="Evaluated like a release"
                body="Twenty golden cases, real metrics, release gates, and a run history you can rerun from the browser."
              />
            </div>
          </div>
        </section>

        <section className="page-shell py-20">
          <div className="surface-card relative overflow-hidden p-8 sm:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border border-line" />
            <div className="pointer-events-none absolute -right-4 top-8 size-40 rounded-full border border-line" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="eyebrow">The demo</p>
                <h2 className="display mt-3 max-w-xl text-[36px] leading-[1.04] sm:text-[44px]">
                  Ask something hard. Watch it refuse, cite, or hand off.
                </h2>
                <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted">
                  The widget is wired to the real pipeline: retrieval, policy,
                  citation verification, persistence, and handoff creation. No
                  model key needed. No email leaves the building.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Link href="/trust" className="btn btn-primary !justify-between">
                  Run the 20-case evaluation <ArrowRight size={15} />
                </Link>
                <Link href="/knowledge" className="btn !justify-between">
                  Try the retrieval playground <ArrowRight size={15} />
                </Link>
                <Link href="/journeys" className="btn !justify-between">
                  Inspect the email sink <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <div className="pb-24 sm:pb-28">
        <SiteFooter />
      </div>
      <ChatWidget />
    </>
  );
}

function statCellClass(index: number): string {
  const cells = [
    "border-r border-b pr-4 md:border-b-0 md:pl-0 md:pr-8",
    "border-b pl-4 md:border-b-0 md:border-r md:pl-8 md:pr-8",
    "border-r pr-4 md:pl-8 md:pr-8",
    "pl-4 md:pl-8 md:pr-0",
  ];
  return `border-line py-6 md:py-9 ${cells[index] ?? ""}`;
}

function Stat({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint: string;
}) {
  return (
    <div>
      <div className="display text-[34px] leading-none">{value}</div>
      <div className="mt-2 min-h-10 text-balance text-[12.5px] font-medium leading-snug">
        {label}
      </div>
      <div className="mt-1 min-h-10 text-balance text-[12px] leading-5 text-muted">
        {hint}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  visual,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  visual: React.ReactNode;
}) {
  return (
    <article className="surface-card flex flex-col overflow-hidden">
      <div className="flex min-h-[188px] items-center border-b border-line bg-paper-2/50 p-4">
        <div className="w-full">{visual}</div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="grid size-9 place-items-center rounded-full border border-line bg-white text-forest">
          {icon}
        </span>
        <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em]">{title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{body}</p>
      </div>
    </article>
  );
}

function PublishVisual() {
  return (
    <div className="rounded-lg border border-line bg-white p-3.5">
      <div className="flex items-center justify-between">
        <span className="mono text-[9px] uppercase tracking-[0.1em] text-muted">
          Design Summit 2026
        </span>
        <span className="chip !border-forest/20 !bg-forest-soft !py-0.5 !text-[9px] !text-forest">
          Live
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="Sold" value="412" />
        <MiniStat label="Paid" value="287" />
        <MiniStat label="Gross" value="₹1.4L" />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2">
        <div className="h-full w-[78%] rounded-full bg-forest" />
      </div>
    </div>
  );
}

function CheckinVisual() {
  return (
    <div className="rounded-lg border border-line bg-white p-3.5">
      <div className="flex items-center justify-between">
        <span className="mono text-[9px] uppercase tracking-[0.1em] text-muted">
          Door 2 · offline
        </span>
        <span className="chip !border-amber/20 !bg-amber-soft !py-0.5 !text-[9px] !text-amber">
          128 queued
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {["#ORB-4821", "#ORB-4822", "#ORB-4823"].map((ticket, i) => (
          <div
            key={ticket}
            className="flex items-center justify-between rounded border border-line px-2 py-1.5"
          >
            <span className="mono text-[10px]">{ticket}</span>
            <span className="flex items-center gap-1 text-[9.5px] text-forest">
              <Check size={10} /> {i === 2 ? "syncing" : "checked in"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnounceVisual() {
  return (
    <div className="rounded-lg border border-line bg-white p-3.5">
      <div className="flex items-center justify-between">
        <span className="mono text-[9px] uppercase tracking-[0.1em] text-muted">
          Announcement
        </span>
        <span className="mono text-[9px] text-muted">Test sent 09:12</span>
      </div>
      <p className="mt-3 text-[12px] font-semibold leading-snug">
        Doors open at 5:30pm. Bring your QR ticket.
      </p>
      <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
        Scheduled to 412 attendees · owner approved
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="chip !py-0.5 !text-[9px]">
          <CreditCard size={10} /> Paid only
        </span>
        <span className="chip !py-0.5 !text-[9px]">
          <Mail size={10} /> Email + app
        </span>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-paper/60 px-2 py-1.5">
      <div className="text-[13px] font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[9px] text-muted">{label}</div>
    </div>
  );
}

function JourneyTeaser({
  step,
  title,
  trigger,
  copy,
  icon,
}: {
  step: string;
  title: string;
  trigger: string;
  copy: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="surface-card p-5">
      <div className="flex items-center justify-between">
        <span className="mono text-[12px] text-muted">{step}</span>
        <span className="grid size-8 place-items-center rounded-full border border-line bg-white text-forest">
          {icon}
        </span>
      </div>
      <h3 className="mt-4 text-[14.5px] font-semibold">{title}</h3>
      <p className="mono mt-1 text-[12px] uppercase tracking-[0.08em] text-forest">
        {trigger}
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-muted">{copy}</p>
    </article>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper/40 p-4">
      <span className="text-forest">{icon}</span>
      <h3 className="mt-3 text-[13.5px] font-semibold">{title}</h3>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function EventConsole() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-[24px] border border-line/70 bg-white/30" />
      <div className="shot relative overflow-hidden rounded-[18px] border border-line bg-[#fffdf8] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between border-b border-line bg-paper-2/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex shrink-0 gap-1.5">
              <span className="size-2 rounded-full bg-[#d9b7a7]" />
              <span className="size-2 rounded-full bg-[#d9cfa7]" />
              <span className="size-2 rounded-full bg-[#b7c9a7]" />
            </span>
            <span className="mono ml-2 truncate text-[12px] uppercase tracking-[0.08em] text-muted">
              orbit.club / design-summit
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-forest">
            <LiveDot /> live
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">Meridian Tech Fest</p>
              <h3 className="display mt-1.5 text-[28px] leading-none">
                Design Summit 2026
              </h3>
              <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-muted">
                <CalendarDays size={12} className="mt-0.5 shrink-0" />
                <span>Sat 12 Dec · 10:00 IST · Main Auditorium</span>
              </p>
            </div>
            <span className="chip shrink-0 !border-forest/20 !bg-forest-soft !text-forest">
              <BadgeCheck size={12} /> Published
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <ConsoleStat label="Registrations" value="412" delta="+38 this week" />
            <ConsoleStat label="Paid" value="287" delta="₹1,40,800" />
            <ConsoleStat label="Checked in" value="128" delta="31% of sold" />
          </div>

          <div className="mt-4 rounded-xl border border-line bg-paper/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold">Check-in progress</span>
              <span className="mono text-[9px] uppercase tracking-[0.08em] text-muted">
                Door 1 + Door 2
              </span>
            </div>
            <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full w-[31%] bg-forest" />
              <div className="h-full w-[9%] bg-[#89a87a]" />
              <div className="h-full flex-1 bg-paper-3" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[9.5px] text-muted">
              <span>128 scanned</span>
              <span>284 remaining</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
              <span className="grid size-6 place-items-center rounded-full bg-forest-soft text-forest">
                <Mail size={12} />
              </span>
              <p className="flex-1 text-[11px]">
                <span className="font-semibold">Reminder scheduled</span> · paid
                attendees only
              </p>
              <span className="mono text-[9px] text-muted">18:00</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
              <span className="grid size-6 place-items-center rounded-full bg-amber-soft text-amber">
                <ScanLine size={12} />
              </span>
              <p className="flex-1 text-[11px]">
                <span className="font-semibold">Offline pack ready</span> · 412
                tickets cached
              </p>
              <span className="mono text-[9px] text-muted">v1</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line bg-paper-2/50 px-4 py-2.5">
          <span className="mono text-[9px] uppercase tracking-[0.1em] text-muted">
            Support · 3 open threads
          </span>
          <span className="flex items-center gap-1 text-[10px] text-forest">
            <Sparkles size={11} /> ProofDesk on duty
          </span>
        </div>
      </div>
    </div>
  );
}

function ConsoleStat({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-white px-2.5 py-2.5">
      <div className="truncate text-[11px] uppercase tracking-[0.04em] text-muted">{label}</div>
      <div className="mt-1 text-[19px] font-semibold leading-none tracking-[-0.02em]">
        {value}
      </div>
      <div className="mt-1 text-[9px] text-muted">{delta}</div>
    </div>
  );
}
