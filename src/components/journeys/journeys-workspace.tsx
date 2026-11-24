"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  Ban,
  Check,
  ChevronRight,
  Clock3,
  CornerDownRight,
  Eye,
  FlaskConical,
  Inbox,
  Loader2,
  Mail,
  Pause,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { Customer, JourneyEnrollment } from "@/lib/types";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { DeliveryBadge, SectionHeading } from "@/components/ui";
import type { DeliveryRow, JourneyRow } from "@/app/journeys/page";

const EVENT_TYPES = [
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

interface PreviewState {
  subject: string;
  preheader: string;
  html: string;
  text: string;
  customerName: string;
  journeyName: string;
}

interface Outcome {
  journeyKey: string;
  journeyName: string;
  status: string;
  detail: string;
}

export function JourneysWorkspace({
  initialJourneys,
  initialDeliveries,
  customers,
  enrollments,
}: {
  initialJourneys: JourneyRow[];
  initialDeliveries: DeliveryRow[];
  customers: Customer[];
  enrollments: JourneyEnrollment[];
}) {
  const [rows, setRows] = useState<JourneyRow[]>(initialJourneys);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>(initialDeliveries);
  const [selectedId, setSelectedId] = useState<string>(
    initialJourneys[0]?.id ?? "",
  );
  const [view, setView] = useState<"journeys" | "sink">("journeys");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "text">(
    "desktop",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[] | null>(null);
  const [testResult, setTestResult] = useState<{
    journeyId: string;
    result: "previewed" | "sent" | "failed" | "suppressed";
    detail: string;
    subject: string | null;
    text: string | null;
  } | null>(null);
  const [customerId, setCustomerId] = useState(
    customers.find((c) => c.email === "maya@kathacollective.in")?.id ??
      customers[0]?.id ??
      "",
  );
  const [eventType, setEventType] =
    useState<(typeof EVENT_TYPES)[number]>("feature.released");
  const [release, setRelease] = useState("offline-checkin-v1");

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;

  const refresh = useCallback(async () => {
    try {
      const [journeyRes, deliveryRes] = await Promise.all([
        fetch("/api/journeys", { cache: "no-store" }),
        fetch("/api/deliveries", { cache: "no-store" }),
      ]);
      if (journeyRes.ok) {
        const data = (await journeyRes.json()) as { journeys: JourneyRow[] };
        setRows(data.journeys);
      }
      if (deliveryRes.ok) {
        const data = (await deliveryRes.json()) as { deliveries: DeliveryRow[] };
        setDeliveries(data.deliveries);
      }
    } catch {
      // Keep the current view.
    }
  }, []);

  const toggleStatus = useCallback(
    async (journey: JourneyRow) => {
      const next = journey.status === "active" ? "paused" : "active";
      setBusy(`status:${journey.id}`);
      try {
        const res = await fetch(`/api/journeys/${journey.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) throw new Error("Could not update the journey.");
        setRows((prev) =>
          prev.map((row) =>
            row.id === journey.id ? { ...row, status: next } : row,
          ),
        );
        setToast(`${journey.name} is now ${next}.`);
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Update failed.");
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const openPreview = useCallback(
    async (journey: JourneyRow) => {
      setBusy(`preview:${journey.id}`);
      try {
        const res = await fetch(`/api/journeys/${journey.id}/preview`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ customerId }),
        });
        const data = (await res.json()) as {
          rendered?: { subject: string; preheader: string; html: string; text: string };
          customer?: { name: string };
          error?: string;
        };
        if (!res.ok || !data.rendered) {
          throw new Error(data.error ?? "Preview failed.");
        }
        setPreview({
          subject: data.rendered.subject,
          preheader: data.rendered.preheader,
          html: data.rendered.html,
          text: data.rendered.text,
          customerName: data.customer?.name ?? "Demo customer",
          journeyName: journey.name,
        });
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Preview failed.");
      } finally {
        setBusy(null);
      }
    },
    [customerId],
  );

  const simulate = useCallback(async () => {
    if (!customerId) return;
    setBusy("simulate");
    setOutcomes(null);
    try {
      const payload: Record<string, unknown> = { source: "journeys-ui" };
      if (eventType === "feature.released") payload.release = release;
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: eventType, customerId, payload }),
      });
      const data = (await res.json()) as {
        outcomes?: Outcome[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Event could not be processed.");
      setOutcomes(data.outcomes ?? []);
      setToast(
        data.outcomes?.length
          ? `Processed ${eventType}: ${data.outcomes.length} outcome(s).`
          : `Processed ${eventType}: no journey matched.`,
      );
      await refresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Event failed.");
    } finally {
      setBusy(null);
    }
  }, [customerId, eventType, refresh, release]);

  const testSelectedJourney = useCallback(async () => {
    if (!selected) return;
    setBusy(`test:${selected.id}`);
    setTestResult(null);
    try {
      const res = await fetch(`/api/journeys/${selected.id}/test`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        result?: "previewed" | "sent" | "failed" | "suppressed";
        detail?: string;
        subject?: string | null;
        text?: string | null;
        html?: string | null;
        preheader?: string | null;
        customerName?: string;
        journeyName?: string;
        error?: string;
      };
      if (!res.ok || !data.result) {
        throw new Error(data.error ?? "Test journey failed.");
      }
      setTestResult({
        journeyId: selected.id,
        result: data.result,
        detail: data.detail ?? "",
        subject: data.subject ?? null,
        text: data.text ?? null,
      });
      if (data.html && data.subject) {
        setPreviewMode("mobile");
        setPreview({
          subject: data.subject,
          preheader: data.preheader ?? "",
          html: data.html,
          text: data.text ?? "",
          customerName: data.customerName ?? "Reviewer sample",
          journeyName: data.journeyName ?? selected.name,
        });
      }
      setToast(
        `${selected.name}: ${data.result}. ${data.detail ?? ""}`.trim(),
      );
      await refresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Test journey failed.");
    } finally {
      setBusy(null);
    }
  }, [refresh, selected]);

  const runCron = useCallback(async () => {
    setBusy("cron");
    try {
      const res = await fetch("/api/cron/inactivity", { method: "POST" });
      const data = (await res.json()) as {
        emitted?: number;
        scanned?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Cron failed.");
      setToast(
        `Inactivity cron scanned ${data.scanned ?? 0} workspaces and emitted ${data.emitted ?? 0} event(s).`,
      );
      await refresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Cron failed.");
    } finally {
      setBusy(null);
    }
  }, [refresh]);

  const deliveryAction = useCallback(
    async (delivery: DeliveryRow, mode: "send" | "queue") => {
      setBusy(`${mode}:${delivery.id}`);
      try {
        const res = await fetch(
          `/api/deliveries/${delivery.id}/send?mode=${mode}`,
          { method: "POST" },
        );
        const data = (await res.json()) as {
          delivery?: { status: string; error: string | null };
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Delivery failed.");
        setToast(
          mode === "queue"
            ? "Delivery queued for the sink."
            : data.delivery?.status === "sent"
              ? "Sent through the email provider to the allowlisted address."
              : data.delivery?.status === "previewed"
                ? "Previewed in the in-app sink. No external email was sent."
                : `Delivery ${data.delivery?.status}: ${data.delivery?.error ?? "provider blocked"}`,
        );
        await refresh();
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Delivery failed.");
      } finally {
        setBusy(null);
      }
    },
    [refresh],
  );

  const counts = useMemo(
    () => ({
      previewed: deliveries.filter((d) => d.status === "previewed").length,
      sent: deliveries.filter((d) => d.status === "sent").length,
      suppressed: deliveries.filter((d) => d.status === "suppressed").length,
      queued: deliveries.filter((d) => d.status === "queued").length,
    }),
    [deliveries],
  );

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-line bg-[#fffdf8]">
          <div className="page-shell py-12 lg:py-16">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Lifecycle studio"
                title="Email that knows when to stop."
                body="Every journey is event-triggered, condition-gated, deduped by entry limits, and exited by real product behaviour. Previews render through React Email; delivery lands in the in-app sink."
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runCron()}
                  disabled={busy === "cron"}
                  className="btn !py-2 !text-[12px]"
                >
                  {busy === "cron" ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Zap size={13} />
                  )}
                  Run inactivity cron
                </button>
                <Link href="/desk" className="btn btn-primary !py-2 !text-[12px]">
                  Agent desk <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-line bg-paper p-0.5">
                <button
                  type="button"
                  onClick={() => setView("journeys")}
                  className={`press min-h-10 rounded-full px-3.5 text-[12px] font-semibold ${
                    view === "journeys"
                      ? "bg-ink text-paper"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  Journeys
                </button>
                <button
                  type="button"
                  onClick={() => setView("sink")}
                  className={`press min-h-10 rounded-full px-3.5 text-[12px] font-semibold ${
                    view === "sink"
                      ? "bg-ink text-paper"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  Email sink
                  <span className="mono ml-1 text-[12px] opacity-70">
                    {deliveries.length}
                  </span>
                </button>
              </div>
              <span className="mono flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-white/60 px-3 text-[12px] uppercase tracking-[0.08em] text-muted">
                <ShieldCheck size={11} className="text-forest" />
                demo sink · no external sends
              </span>
              <span className="mono ml-auto hidden text-[9px] uppercase tracking-[0.1em] text-muted sm:inline">
                {enrollments.length} enrollments · {counts.sent} sent
              </span>
            </div>
          </div>
        </section>

        {view === "journeys" ? (
          <section className="page-shell py-10">
            <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
              <div className="space-y-2.5">
                {rows.map((journey, index) => {
                  const active = journey.id === selected?.id;
                  return (
                    <button
                      key={journey.id}
                      type="button"
                      onClick={() => setSelectedId(journey.id)}
                      className={`block w-full rounded-xl border p-4 text-left transition-all ${
                        active
                          ? "border-ink bg-white shadow-[var(--shadow-sm)]"
                          : "border-line bg-[#fffdf8] hover:border-line-strong"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="mono text-[9px] uppercase tracking-[0.1em] text-muted">
                          0{index + 1}
                        </span>
                        <span
                          className={`mono rounded px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] ${
                            journey.status === "active"
                              ? "bg-forest-soft text-forest"
                              : journey.status === "paused"
                                ? "bg-amber-soft text-amber"
                                : "bg-paper-2 text-muted"
                          }`}
                        >
                          {journey.status}
                        </span>
                      </div>
                      <h3 className="mt-2 text-[14px] font-semibold">{journey.name}</h3>
                      <p className="mono mt-1 text-[9px] uppercase tracking-[0.06em] text-forest">
                        {journey.triggerEvent}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted">
                        <span className="flex items-center gap-1">
                          <Users size={10} /> {journey.stats.enrollments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Inbox size={10} /> {journey.stats.previewed}
                        </span>
                        <span className="flex items-center gap-1">
                          <Check size={10} /> {journey.stats.completed}
                        </span>
                        <span className="flex items-center gap-1">
                          <Ban size={10} /> {journey.stats.suppressed}
                        </span>
                      </div>
                      {active ? (
                        <span className="mono mt-3 flex items-center gap-1 text-[8.5px] uppercase tracking-[0.08em] text-forest">
                          Selected <ChevronRight size={9} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                <div className="rounded-xl border border-line bg-paper-2/50 p-4">
                  <p className="eyebrow">Dedupe & limits</p>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                    Welcome is once per workspace. Inactivity is keyed to the draft
                    date. Feature updates are keyed to workspace + release.
                    Offboarding is keyed to the billing period.
                  </p>
                </div>
              </div>

              {selected ? (
                <div className="space-y-4">
                  <div className="surface-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="eyebrow">Journey</p>
                        <h2 className="display mt-1 text-[30px] leading-none">
                          {selected.name}
                        </h2>
                        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">
                          {selected.description}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => void testSelectedJourney()}
                          disabled={busy === `test:${selected.id}`}
                          className="btn btn-primary !px-3 !py-2 !text-[12px]"
                        >
                          {busy === `test:${selected.id}` ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Play size={12} />
                          )}
                          Test journey
                        </button>
                        <button
                          type="button"
                          onClick={() => void openPreview(selected)}
                          disabled={busy === `preview:${selected.id}`}
                          className="btn !px-3 !py-2 !text-[12px]"
                        >
                          {busy === `preview:${selected.id}` ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Eye size={12} />
                          )}
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleStatus(selected)}
                          disabled={busy === `status:${selected.id}`}
                          className={`btn !px-3 !py-2 !text-[12px] ${
                            selected.status === "active" ? "" : "!bg-ink !text-paper"
                          }`}
                        >
                          {selected.status === "active" ? (
                            <>
                              <Pause size={12} /> Pause
                            </>
                          ) : (
                            <>
                              <Play size={12} /> Activate
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Detail label="Trigger" value={selected.triggerEvent} mono />
                      <Detail label="Timing" value={selected.timing} />
                      <Detail label="Entry limit" value={selected.entryLimit ?? "Once"} />
                      <Detail
                        label="Status"
                        value={selected.status}
                        tone={selected.status === "active" ? "forest" : "amber"}
                      />
                    </div>

                    <div className="mt-4 rounded-xl border border-line bg-paper/50 p-4">
                      <p className="eyebrow">Condition</p>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed">
                        {selected.condition}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {selected.exitRules.map((rule) => (
                          <span
                            key={rule}
                            className="chip !bg-white/70 !py-1 !text-[12px]"
                          >
                            <CornerDownRight size={9} /> {rule}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      className="mt-4 rounded-xl border border-line bg-white p-4"
                      data-testid="journey-final-copy"
                    >
                      <p className="eyebrow">Final copy</p>
                      <p className="mt-2 text-[13px] font-semibold">
                        {selected.finalSubject}
                      </p>
                      <p className="mt-1 text-[12px] text-muted">
                        Preheader: {selected.finalPreheader}
                      </p>
                      <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-ink-2">
                        {selected.finalText}
                      </pre>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="chip !py-0.5 !text-[9px]">
                          <Mail size={9} /> {selected.emailKind}
                        </span>
                        <span className="chip !py-0.5 !text-[9px]">
                          <Sparkles size={9} /> React Email
                        </span>
                        <span className="chip !py-0.5 !text-[9px]">
                          <ShieldCheck size={9} /> merge-safe
                        </span>
                      </div>
                    </div>

                    {testResult && testResult.journeyId === selected.id ? (
                      <div
                        className="mt-4 rounded-xl border border-forest/20 bg-forest-soft/40 p-4"
                        data-testid="journey-test-result"
                      >
                        <p className="text-[12px] font-semibold">
                          Test result: {testResult.result}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
                          {testResult.detail}
                        </p>
                        {testResult.subject ? (
                          <p className="mt-2 text-[12px]">
                            <span className="font-semibold">Final subject: </span>
                            {testResult.subject}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                      <Mini label="Enrolled" value={selected.stats.enrollments} />
                      <Mini label="Active" value={selected.stats.active} />
                      <Mini label="Previewed" value={selected.stats.previewed} />
                      <Mini label="Sent" value={selected.stats.sent} />
                      <Mini label="Suppressed" value={selected.stats.suppressed} />
                      <Mini label="Completed" value={selected.stats.completed} />
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="surface-card p-5">
                      <div className="flex items-center justify-between">
                        <p className="eyebrow">Simulate a trigger</p>
                        <FlaskConical size={14} className="text-muted" />
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
                        Sends a real lifecycle event through the engine, including
                        conditions, exits, dedupe, rendering, and the sink.
                      </p>
                      <div className="mt-3 space-y-2.5">
                        <label className="block">
                          <span className="mono text-[9px] uppercase tracking-[0.08em] text-muted">
                            Workspace
                          </span>
                          <select
                            value={customerId}
                            onChange={(event) => setCustomerId(event.target.value)}
                            className="field mt-1 !py-2 !text-[12px]"
                          >
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name} · {customer.club}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mono text-[9px] uppercase tracking-[0.08em] text-muted">
                            Event
                          </span>
                          <select
                            value={eventType}
                            onChange={(event) =>
                              setEventType(
                                event.target.value as (typeof EVENT_TYPES)[number],
                              )
                            }
                            className="field mt-1 !py-2 !text-[12px]"
                          >
                            {EVENT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </label>
                        {eventType === "feature.released" ? (
                          <label className="block">
                            <span className="mono text-[9px] uppercase tracking-[0.08em] text-muted">
                              Release key
                            </span>
                            <input
                              value={release}
                              onChange={(event) => setRelease(event.target.value)}
                              className="field mt-1 !py-2 !text-[12px]"
                            />
                          </label>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void simulate()}
                          disabled={busy === "simulate"}
                          className="btn btn-primary w-full !py-2 !text-[11.5px]"
                        >
                          {busy === "simulate" ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Play size={12} />
                          )}
                          Process event
                        </button>
                      </div>

                      {outcomes ? (
                        <div className="mt-3 space-y-1.5">
                          {outcomes.length === 0 ? (
                            <p className="rounded-lg border border-line bg-paper px-2.5 py-2 text-[10.5px] text-muted">
                              No active journey matched this event.
                            </p>
                          ) : (
                            outcomes.map((outcome, index) => (
                              <div
                                key={`${outcome.journeyKey}:${index}`}
                                className="rounded-lg border border-line bg-paper px-2.5 py-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10.5px] font-semibold">
                                    {outcome.journeyName}
                                  </span>
                                  <span
                                    className={`mono rounded px-1 py-0.5 text-[8px] uppercase ${
                                      outcome.status === "enrolled"
                                        ? "bg-forest-soft text-forest"
                                        : outcome.status === "suppressed"
                                          ? "bg-amber-soft text-amber"
                                          : "bg-paper-2 text-muted"
                                    }`}
                                  >
                                    {outcome.status}
                                  </span>
                                </div>
                                <p className="mt-1 text-[10px] leading-snug text-muted">
                                  {outcome.detail}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="surface-card p-5">
                      <p className="eyebrow">Recent runs</p>
                      <div className="mt-2 divide-y divide-line">
                        {selected.recentRuns.length ? (
                          selected.recentRuns.map((run) => (
                            <div key={run.id} className="py-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10.5px] font-medium">
                                  {run.eventType}
                                </span>
                                <span
                                  className={`mono rounded px-1 py-0.5 text-[8px] uppercase ${
                                    run.status === "enrolled"
                                      ? "bg-forest-soft text-forest"
                                      : run.status === "suppressed"
                                        ? "bg-amber-soft text-amber"
                                        : "bg-paper-2 text-muted"
                                  }`}
                                >
                                  {run.status}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[10px] leading-snug text-muted">
                                {run.detail}
                              </p>
                              <p className="mono mt-1 text-[8px] uppercase tracking-[0.06em] text-muted">
                                {run.customerName} ·{" "}
                                {new Date(run.createdAt).toLocaleString("en-IN")}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="py-6 text-center text-[11px] text-muted">
                            No runs yet. Simulate a trigger.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="page-shell py-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold">In-app email sink</h2>
                <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">
                  Demo captures are labeled previewed. The sink does not send
                  email. A delivery is sent only when Resend is configured and the
                  recipient is the allowlisted address.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="chip !py-1 !text-[9.5px]">
                  <Clock3 size={10} /> {counts.queued} queued
                </span>
                <span className="chip !border-forest/20 !bg-forest-soft !py-1 !text-[9.5px] !text-forest">
                  <Check size={10} /> {counts.sent} sent
                </span>
                <span className="chip !border-amber/20 !bg-amber-soft !py-1 !text-[9.5px] !text-amber">
                  <Eye size={10} /> {counts.previewed} previewed
                </span>
                <span className="chip !py-1 !text-[9.5px]">
                  <Ban size={10} /> {counts.suppressed} suppressed
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-[#fffdf8]">
              <div className="scroll-thin overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line bg-paper-2/50">
                      {["Recipient", "Journey", "Subject", "Status", "Provider", "Created", ""].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="mono px-3 py-2.5 text-[8.5px] uppercase tracking-[0.1em] text-muted"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        className="border-b border-line/70 transition-colors hover:bg-paper/60"
                      >
                        <td className="px-3 py-3">
                          <div className="text-[11.5px] font-medium">
                            {delivery.customerName}
                          </div>
                          <div className="text-[9.5px] text-muted">
                            {delivery.recipient}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[10.5px] text-muted">
                          {delivery.journeyName}
                        </td>
                        <td className="max-w-[240px] px-3 py-3 text-[10.5px]">
                          <div className="truncate font-medium">{delivery.subject}</div>
                          <div className="truncate text-[9.5px] text-muted">
                            {delivery.preheader}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <DeliveryBadge status={delivery.status} />
                          {delivery.error ? (
                            <div className="mt-1 max-w-[160px] text-[8.5px] leading-snug text-rust">
                              {delivery.error}
                            </div>
                          ) : null}
                        </td>
                        <td className="mono px-3 py-3 text-[9px] uppercase text-muted">
                          {delivery.provider}
                        </td>
                        <td className="mono px-3 py-3 text-[9px] text-muted">
                          {new Date(delivery.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreview({
                                  subject: delivery.subject,
                                  preheader: delivery.preheader,
                                  html: delivery.html,
                                  text: delivery.text,
                                  customerName: delivery.customerName,
                                  journeyName: delivery.journeyName,
                                })
                              }
                              className="btn btn-icon"
                              aria-label="Preview email"
                              title="Preview"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void deliveryAction(delivery, "queue")}
                              disabled={
                                busy !== null ||
                                delivery.status === "sent" ||
                                delivery.status === "suppressed"
                              }
                              className="btn btn-icon"
                              aria-label="Queue delivery"
                              title="Queue"
                            >
                              <Clock3 size={12} />
                            </button>
                            {delivery.provider === "demo-sink" ? (
                              <span
                                className="mono inline-flex min-h-10 items-center rounded-lg border border-line px-2 text-[12px] text-muted"
                                title="Orbit demo: this email is previewed, not sent."
                              >
                                Preview only
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void deliveryAction(delivery, "send")}
                                disabled={
                                  busy !== null ||
                                  delivery.status === "sent" ||
                                  delivery.status === "suppressed"
                                }
                                className="btn min-h-10 !px-2 !text-[12px]"
                                aria-label="Send delivery"
                              >
                                {busy === `send:${delivery.id}` ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Send size={12} />
                                )}
                                Send
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {deliveries.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                  <Inbox size={24} className="text-muted" />
                  <p className="text-[12.5px] font-medium">No deliveries yet</p>
                  <p className="text-[11.5px] text-muted">
                    Simulate a lifecycle event to render the first email.
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-3 sm:p-6">
          <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-[#fbfaf5] shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-[#fffdf8] px-4 py-3">
              <div>
                <p className="mono text-[9px] uppercase tracking-[0.1em] text-muted">
                  {preview.journeyName} · to {preview.customerName}
                </p>
                <p className="mt-0.5 text-[13px] font-semibold">{preview.subject}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="inline-flex rounded-full border border-line bg-paper p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    className={`min-h-10 rounded-full px-3 text-[12px] font-semibold ${
                      previewMode === "desktop" ? "bg-ink text-paper" : "text-muted"
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    className={`min-h-10 rounded-full px-3 text-[12px] font-semibold ${
                      previewMode === "mobile" ? "bg-ink text-paper" : "text-muted"
                    }`}
                  >
                    Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("text")}
                    className={`min-h-10 rounded-full px-3 text-[12px] font-semibold ${
                      previewMode === "text" ? "bg-ink text-paper" : "text-muted"
                    }`}
                  >
                    Plain text
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="btn btn-ghost btn-icon"
                  aria-label="Close preview"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-paper-2/40 p-3">
              {previewMode === "text" ? (
                <pre className="scroll-thin h-[64dvh] overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-white p-4 text-[12px] leading-relaxed text-ink-2">
                  {preview.text}
                </pre>
              ) : (
                <div
                  className={
                    previewMode === "mobile" ? "mx-auto w-full max-w-[390px]" : ""
                  }
                >
                  <iframe
                    title={`Email preview: ${preview.subject}`}
                    srcDoc={preview.html}
                    sandbox=""
                    className="h-[64dvh] w-full rounded-lg border border-line bg-white"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#fffdf8] px-4 py-2.5">
              <p className="mono flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.08em] text-muted">
                <ShieldCheck size={10} className="text-forest" />
                Rendered locally · merge fields resolved
              </p>
              <p className="max-w-md truncate text-[9.5px] text-muted">
                {preview.preheader}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-[60] max-w-[92vw] -translate-x-1/2 rounded-full border border-ink bg-ink px-4 py-2 text-center text-[11.5px] text-paper shadow-lg">
          {toast}
        </div>
      ) : null}
    </>
  );
}

function Detail({
  label,
  value,
  mono = false,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "forest" | "amber";
}) {
  return (
    <div className="rounded-lg border border-line bg-paper/50 px-3 py-2">
      <p className="mono text-[12px] uppercase tracking-[0.08em] text-muted">{label}</p>
      <p
        className={`mt-1 text-[12px] font-medium ${
          tone === "forest" ? "text-forest" : tone === "amber" ? "text-amber" : ""
        } ${mono ? "mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white px-2.5 py-2 text-center">
      <div className="text-[17px] font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[8.5px] uppercase tracking-[0.06em] text-muted">
        {label}
      </div>
    </div>
  );
}
