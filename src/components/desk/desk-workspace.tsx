"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CircleAlert,
  Clock3,
  FileText,
  Handshake,
  Inbox,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import type {
  Agent,
  Citation,
  Conversation,
  Customer,
  Handoff,
  Message,
  Queue,
} from "@/lib/types";
import {
  DecisionBadge,
  LiveDot,
  RiskBadge,
  StatusBadge,
  Wordmark,
  statusLabel,
} from "@/components/ui";

export interface DeskRow extends Conversation {
  customer: Customer | null;
  queue: Queue | null;
  assignee: Agent | null;
  handoff: {
    id: string;
    status: Handoff["status"];
    destinationQueue: string;
    riskClass: Handoff["riskClass"];
  } | null;
  lastMessage: { role: Message["role"]; content: string; createdAt: string } | null;
}

export interface Detail {
  conversation: Conversation;
  customer: Customer | null;
  messages: Message[];
  citations: Citation[];
  handoff: Handoff | null;
  queue: Queue | null;
  assignee: Agent | null;
}

type FilterKey = "all" | Conversation["status"];

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs_human", label: "Needs a person" },
  { key: "human_owned", label: "Human owned" },
  { key: "ai_active", label: "AI active" },
  { key: "resolved", label: "Resolved" },
];

function relativeTime(value: string, now: number): string {
  const diff = now - new Date(value).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function clock(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const avatarPalette = ["#27523c", "#2c5677", "#8a5a12", "#a53f2b", "#4c3d6b"];

function avatarColor(seed: string): string {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return avatarPalette[sum % avatarPalette.length] ?? avatarPalette[0]!;
}

export function DeskWorkspace({
  initialRows,
  counts: initialCounts,
  agents,
  initialDetail,
  initialSelectedId = null,
  preferDetail = false,
  serverNow,
}: {
  initialRows: DeskRow[];
  counts: Record<string, number>;
  agents: Agent[];
  initialDetail: Detail | null;
  initialSelectedId?: string | null;
  preferDetail?: boolean;
  serverNow?: number;
}) {
  const [rows, setRows] = useState<DeskRow[]>(initialRows);
  const [counts, setCounts] = useState(initialCounts);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ??
      initialRows.find((r) => r.status === "needs_human")?.id ??
      initialRows[0]?.id ??
      null,
  );
  const [detail, setDetail] = useState<Detail | null>(initialDetail);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<"handoff" | "sources" | "trace">("handoff");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showCaseFile, setShowCaseFile] = useState(false);
  const [showListMobile, setShowListMobile] = useState(!preferDetail);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const operator = agents[0] ?? null;
  const now = serverNow ?? 0;

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return rows
      .filter((row) => (filter === "all" ? true : row.status === filter))
      .filter((row) => {
        if (!needle) return true;
        return (
          row.subject.toLowerCase().includes(needle) ||
          (row.customer?.name ?? "").toLowerCase().includes(needle) ||
          (row.customer?.club ?? "").toLowerCase().includes(needle) ||
          (row.lastMessage?.content ?? "").toLowerCase().includes(needle)
        );
      });
  }, [filter, query, rows]);

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        conversations: DeskRow[];
        counts: Record<string, number>;
      };
      setRows(data.conversations);
      setCounts(data.counts);
    } catch {
      // Keep the current list if refresh fails.
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshList();
    }, 4000);
    const onFocus = () => {
      void refreshList();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshList]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/conversations/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Conversation could not be loaded.");
      const data = (await res.json()) as Detail;
      setDetail(data);
    } catch {
      setToast("Could not load this conversation.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const el = messagesEnd.current;
    if (el) el.scrollIntoView({ block: "end" });
  }, [detail?.messages.length, detailLoading]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectRow = (id: string) => {
    setSelectedId(id);
    setShowListMobile(false);
    setShowCaseFile(false);
    void loadDetail(id);
  };

  const act = useCallback(
    async (body: Record<string, unknown>, label: string) => {
      if (!selectedId || !operator) return;
      setBusy(label);
      try {
        const res = await fetch(`/api/conversations/${selectedId}/actions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Action failed.");
        setToast(
          label === "reply"
            ? "Reply sent."
            : label === "resolve"
              ? "Conversation resolved."
              : label === "reopen"
                ? "Conversation reopened."
                : "Conversation claimed.",
        );
        setReply("");
        await Promise.all([loadDetail(selectedId), refreshList()]);
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Action failed.");
      } finally {
        setBusy(null);
      }
    },
    [loadDetail, operator, refreshList, selectedId],
  );

  const confirmHandoff = useCallback(async () => {
    const handoff = detail?.handoff;
    if (!handoff) return;
    setBusy("handoff");
    try {
      const res = await fetch(`/api/handoffs/${handoff.id}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: "Confirmed on the agent desk." }),
      });
      if (!res.ok) throw new Error("Handoff could not be confirmed.");
      setToast("Handoff confirmed. It is assigned to the queue.");
      if (selectedId) await loadDetail(selectedId);
      await refreshList();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Handoff failed.");
    } finally {
      setBusy(null);
    }
  }, [detail?.handoff, loadDetail, refreshList, selectedId]);

  const selectedRow = rows.find((row) => row.id === selectedId) ?? null;
  const conversation = detail?.conversation ?? selectedRow;
  const customer = detail?.customer ?? selectedRow?.customer ?? null;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-paper">
      <header className="flex h-[56px] shrink-0 items-center justify-between gap-3 border-b border-line bg-[#fffdf8] px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" aria-label="Orbit home" className="shrink-0">
            <Wordmark compact />
          </Link>
          <span className="hidden h-4 w-px bg-line sm:block" />
          <div className="hidden min-w-0 items-center gap-2 sm:flex">
            <span className="text-[13px] font-semibold">Agent desk</span>
            <span className="mono rounded border border-line px-1.5 py-0.5 text-[8.5px] uppercase tracking-[0.1em] text-muted">
              ProofDesk
            </span>
            <span className="flex items-center gap-1.5 text-[10.5px] text-forest">
              <LiveDot /> live
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mono hidden items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-muted md:inline-flex">
            <ShieldCheck size={11} className="text-forest" />
            policy-gated
          </span>
          <Link
            href="/trust"
            className="mono hidden rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-muted hover:bg-paper-2 hover:text-ink lg:inline-flex"
          >
            Trust Center
          </Link>
          <Link
            href="/knowledge"
            className="mono hidden rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-muted hover:bg-paper-2 hover:text-ink lg:inline-flex"
          >
            Knowledge
          </Link>
          {operator ? (
            <span
              className="ml-1 grid size-7 place-items-center rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: operator.color }}
              title={`${operator.name} · ${operator.role}`}
            >
              {operator.initials}
            </span>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`${
            showListMobile ? "flex" : "hidden"
          } w-full min-w-0 flex-col border-r border-line bg-[#f9f7f1] lg:flex lg:w-[318px] lg:shrink-0`}
        >
          <div className="border-b border-line p-3">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people, clubs, threads"
                className="field !bg-white !pl-8 !text-[12.5px]"
                aria-label="Search conversations"
              />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {filters.map((item) => {
                const count = counts[item.key] ?? 0;
                const active = filter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    aria-label={`${item.label} ${count}`}
                    className={`press min-h-10 shrink-0 rounded-full border px-3 text-[12px] font-medium ${
                      active
                        ? "border-ink bg-ink text-paper"
                        : "border-line bg-white/60 text-muted hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    {item.label}{" "}
                    <span
                      className={`mono text-[12px] ${
                        active ? "text-[#f7f5ee]" : "text-muted"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <Inbox size={22} className="text-muted" />
                <p className="text-[12.5px] font-medium">No threads here</p>
                <p className="text-[11.5px] text-muted">
                  Adjust the filter or search term.
                </p>
              </div>
            ) : (
              filtered.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => selectRow(row.id)}
                  className={`block w-full border-b border-line/80 px-3 py-3 text-left transition-colors ${
                    selectedId === row.id
                      ? "border-l-2 border-l-forest bg-white"
                      : "border-l-2 border-l-transparent hover:bg-white/60"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold text-white"
                      style={{
                        backgroundColor: avatarColor(row.customer?.name ?? row.id),
                      }}
                    >
                      {initialsOf(row.customer?.name ?? "Orbit")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[12.5px] font-semibold">
                          {row.customer?.name ?? "Unknown customer"}
                        </span>
                        <span className="mono shrink-0 text-[12px] text-muted">
                          {relativeTime(row.lastMessageAt, now)}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-muted">
                        {row.customer?.club ?? "Orbit workspace"}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-ink-2">
                        {row.lastMessage?.content ?? row.subject}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span
                          className={`mono rounded px-1.5 py-0.5 text-[11px] uppercase tracking-[0.04em] ${
                            row.status === "needs_human"
                              ? "bg-rust-soft text-rust"
                              : row.status === "human_owned"
                                ? "bg-forest-soft text-forest"
                                : row.status === "resolved"
                                  ? "bg-paper-2 text-muted"
                                  : "bg-sky-soft text-sky"
                          }`}
                        >
                          {statusLabel(row.status)}
                        </span>
                        {row.handoff ? (
                          <span className="mono flex items-center gap-0.5 rounded bg-rust-soft px-1.5 py-0.5 text-[11px] uppercase tracking-[0.04em] text-rust">
                            <Handshake size={8} /> {row.handoff.status.replace("_", " ")}
                          </span>
                        ) : null}
                        {row.risk === "high" ? (
                          <span className="mono rounded bg-rust-soft px-1.5 py-0.5 text-[11px] uppercase tracking-[0.04em] text-rust">
                            high risk
                          </span>
                        ) : null}
                        {row.assignee ? (
                          <span className="mono ml-auto flex items-center gap-1 text-[8.5px] text-muted">
                            <UserRound size={8} /> {row.assignee.initials}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line px-3 py-2">
            <span className="mono text-[9px] uppercase tracking-[0.1em] text-muted">
              {filtered.length} of {rows.length} threads
            </span>
            <button
              type="button"
              onClick={() => void refreshList()}
              className="btn btn-ghost !p-1.5"
              aria-label="Refresh conversation list"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </aside>

        <main
          className={`${
            showListMobile ? "hidden" : "flex"
          } min-w-0 flex-1 flex-col bg-paper lg:flex`}
        >
          {!conversation || !customer ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <MessageSquare size={28} className="text-muted" />
              <p className="text-[14px] font-medium">Select a conversation</p>
              <p className="max-w-xs text-[12px] text-muted">
                Threads arrive here from the Orbit widget. Sensitive requests
                arrive with a prepared handoff packet.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-[#fffdf8] px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowListMobile(true)}
                    className="btn btn-ghost !p-1.5 lg:hidden"
                    aria-label="Back to conversation list"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
                    style={{ backgroundColor: avatarColor(customer.name) }}
                  >
                    {initialsOf(customer.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h1 className="truncate text-[13.5px] font-semibold">
                        {customer.name}
                      </h1>
                      <span className="mono hidden rounded border border-line px-1 py-0.5 text-[8px] uppercase tracking-[0.08em] text-muted sm:inline">
                        {customer.role}
                      </span>
                      <StatusBadge status={conversation.status} />
                      <RiskBadge risk={conversation.risk} />
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {customer.club} · {customer.email} ·{" "}
                      {detail?.queue?.name ?? selectedRow?.queue?.name ?? "Unrouted"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCaseFile(true)}
                    className="btn !px-2.5 !py-1.5 !text-[11px] xl:hidden"
                  >
                    <FileText size={12} /> Case file
                  </button>
                  {!conversation.assignedAgentId && operator ? (
                    <button
                      type="button"
                      onClick={() => void act({ action: "claim", agentId: operator.id }, "claim")}
                      disabled={busy !== null}
                      className="btn !px-2.5 !py-1.5 !text-[11px]"
                    >
                      {busy === "claim" ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <UserRound size={12} />
                      )}
                      Claim
                    </button>
                  ) : null}
                  {conversation.status === "resolved" ? (
                    <button
                      type="button"
                      onClick={() => void act({ action: "reopen" }, "reopen")}
                      disabled={busy !== null}
                      className="btn !px-2.5 !py-1.5 !text-[11px]"
                    >
                      Reopen
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void act({ action: "resolve" }, "resolve")}
                      disabled={busy !== null}
                      className="btn !px-2.5 !py-1.5 !text-[11px]"
                    >
                      <Check size={12} /> Resolve
                    </button>
                  )}
                </div>
              </div>

              {detail?.handoff &&
              detail.handoff.status === "pending_confirmation" ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rust/20 bg-rust-soft/60 px-4 py-2">
                  <p className="flex items-center gap-1.5 text-[11.5px] text-rust">
                    <Handshake size={13} />
                    Handoff to {detail.handoff.destinationQueue} is waiting for
                    customer confirmation.
                  </p>
                  <button
                    type="button"
                    onClick={() => void confirmHandoff()}
                    disabled={busy === "handoff"}
                    className="btn btn-danger !px-2.5 !py-1 !text-[10.5px]"
                  >
                    {busy === "handoff" ? "Confirming…" : "Confirm handoff"}
                  </button>
                </div>
              ) : null}

              <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {detailLoading && !detail ? (
                  <div className="flex items-center gap-2 py-8 text-[12px] text-muted">
                    <Loader2 size={14} className="animate-spin" /> Loading thread…
                  </div>
                ) : (
                  <div className="mx-auto max-w-[720px] space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="hairline flex-1" />
                      <span className="mono text-[9px] uppercase tracking-[0.1em] text-muted">
                        {conversation.subject}
                      </span>
                      <span className="hairline flex-1" />
                    </div>
                    {(detail?.messages ?? []).map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        customer={customer}
                        citations={(detail?.citations ?? []).filter(
                          (citation) => citation.messageId === message.id,
                        )}
                      />
                    ))}
                    <div ref={messagesEnd} />
                  </div>
                )}
              </div>

              <div className="border-t border-line bg-[#fffdf8] px-4 py-3">
                {conversation.status === "resolved" ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-paper px-3 py-2.5">
                    <p className="flex items-center gap-2 text-[11.5px] text-muted">
                      <BadgeCheck size={14} className="text-forest" />
                      This thread is resolved. Reopen it to reply.
                    </p>
                    <button
                      type="button"
                      onClick={() => void act({ action: "reopen" }, "reopen")}
                      className="btn !px-2.5 !py-1 !text-[10.5px]"
                    >
                      Reopen
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!reply.trim() || !operator) return;
                      void act(
                        {
                          action: "reply",
                          agentId: operator.id,
                          content: reply.trim(),
                        },
                        "reply",
                      );
                    }}
                  >
                    <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-white px-3 py-2 focus-within:border-forest">
                      <textarea
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        rows={1}
                        maxLength={4000}
                        placeholder={`Reply as ${operator?.name ?? "an agent"}…`}
                        className="max-h-32 min-h-[26px] flex-1 resize-none bg-transparent text-[12.5px] outline-none placeholder:text-[#9a9c93]"
                        onKeyDown={(event) => {
                          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                            event.preventDefault();
                            if (!reply.trim() || !operator) return;
                            void act(
                              {
                                action: "reply",
                                agentId: operator.id,
                                content: reply.trim(),
                              },
                              "reply",
                            );
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={busy !== null || !reply.trim()}
                        className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-paper hover:bg-forest disabled:opacity-35"
                        aria-label="Send reply"
                      >
                        {busy === "reply" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="mono flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-muted">
                        <ShieldCheck size={10} />
                        Agent replies are audited · ⌘↵ to send
                      </p>
                      <button
                        type="button"
                        disabled={busy !== null || !reply.trim() || !operator}
                        onClick={() => {
                          if (!reply.trim() || !operator) return;
                          void act(
                            {
                              action: "reply",
                              agentId: operator.id,
                              content: reply.trim(),
                              resolve: true,
                            },
                            "reply",
                          );
                        }}
                        className="mono text-[9px] uppercase tracking-[0.08em] text-forest hover:underline disabled:opacity-40"
                      >
                        Send & resolve
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </main>

        <aside className="hidden w-[336px] shrink-0 flex-col border-l border-line bg-[#f9f7f1] xl:flex">
          <ContextPanel
            detail={detail}
            conversation={conversation}
            tab={tab}
            setTab={setTab}
            onConfirmHandoff={confirmHandoff}
            busy={busy}
            now={now}
          />
        </aside>
      </div>

      {showCaseFile ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 xl:hidden">
          <div className="flex h-full w-full max-w-[380px] flex-col border-l border-line bg-[#f9f7f1]">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-[13px] font-semibold">Case file</span>
              <button
                type="button"
                onClick={() => setShowCaseFile(false)}
                className="btn btn-ghost !p-1.5"
                aria-label="Close case file"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <ContextPanel
                detail={detail}
                conversation={conversation}
                tab={tab}
                setTab={setTab}
                onConfirmHandoff={confirmHandoff}
                busy={busy}
                now={now}
              />
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-ink bg-ink px-4 py-2 text-[11.5px] text-paper shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function MessageBubble({
  message,
  customer,
  citations,
}: {
  message: Message;
  customer: Customer;
  citations: Citation[];
}) {
  const [showTrace, setShowTrace] = useState(false);
  const isCustomer = message.role === "customer";
  const isAgent = message.role === "agent";
  const isAssistant = message.role === "assistant";

  if (message.role === "system") {
    return (
      <div className="flex justify-center">
        <span className="mono rounded-full border border-line bg-white/70 px-3 py-1 text-[9px] uppercase tracking-[0.08em] text-muted">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${isCustomer ? "justify-start" : "justify-end"}`}>
      {isCustomer ? (
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[9.5px] font-semibold text-white"
          style={{ backgroundColor: avatarColor(customer.name) }}
        >
          {initialsOf(customer.name)}
        </span>
      ) : null}
      <div className={`min-w-0 max-w-[86%] ${isCustomer ? "" : "items-end"}`}>
        <div className="mb-1 flex items-center gap-1.5 text-[9px] text-muted">
          <span className="font-medium">
            {isCustomer
              ? customer.name
              : isAgent
                ? "Orbit agent"
                : "ProofDesk"}
          </span>
          <span className="mono">{clock(message.createdAt)}</span>
        </div>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
            isCustomer
              ? "rounded-tl-md border border-line bg-white text-ink"
              : isAgent
                ? "rounded-tr-md bg-forest text-paper"
                : "rounded-tr-md border border-line bg-[#fffdf8] text-ink"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {isAssistant ? (
          <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5">
            {message.decision ? (
              <DecisionBadge decision={message.decision} short />
            ) : null}
            {message.risk ? <RiskBadge risk={message.risk} /> : null}
            <span className="mono text-[8.5px] uppercase tracking-[0.06em] text-muted">
              {message.model} · {message.latencyMs ?? 0}ms
            </span>
          </div>
        ) : null}
        {isAssistant && citations.length ? (
          <div className="mt-1.5 space-y-1">
            {citations.map((citation) => (
              <div
                key={citation.id}
                className="flex items-start gap-1.5 rounded-lg border border-line bg-white/70 px-2 py-1.5"
              >
                <FileText size={10} className="mt-0.5 shrink-0 text-forest" />
                <div className="min-w-0 text-[9.5px] leading-snug text-muted">
                  <span className="font-semibold text-ink-2">
                    {citation.sourceTitle}
                  </span>{" "}
                  <span className="mono">v{citation.sourceVersion}</span> ·{" "}
                  {citation.owner}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {isAssistant && message.trace ? (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={() => setShowTrace((value) => !value)}
              className="mono text-[8.5px] uppercase tracking-[0.08em] text-muted hover:text-ink"
            >
              {showTrace ? "Hide trace" : "Trace"}
            </button>
          </div>
        ) : null}
        {isAssistant && showTrace && message.trace ? (
          <pre className="scroll-thin mt-1 max-h-64 overflow-auto rounded-lg border border-line bg-paper-2/70 p-2 text-[9px] leading-relaxed text-muted">
            {JSON.stringify(message.trace, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

function ContextPanel({
  detail,
  conversation,
  tab,
  setTab,
  onConfirmHandoff,
  busy,
  now,
}: {
  detail: Detail | null;
  conversation: Conversation | DeskRow | null;
  tab: "handoff" | "sources" | "trace";
  setTab: (tab: "handoff" | "sources" | "trace") => void;
  onConfirmHandoff: () => Promise<void>;
  busy: string | null;
  now: number;
}) {
  const handoff = detail?.handoff ?? null;
  const citations = detail?.citations ?? [];
  const latestAssistant = [...(detail?.messages ?? [])]
    .reverse()
    .find((message) => message.role === "assistant");

  return (
    <>
      <div className="grid grid-cols-3 border-b border-line">
        {(
          [
            { key: "handoff", label: "Handoff" },
            { key: "sources", label: "Sources" },
            { key: "trace", label: "Trace" },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`border-b-2 px-2 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors ${
              tab === item.key
                ? "border-forest text-forest"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {item.label}
            {item.key === "sources" && citations.length ? (
              <span className="mono ml-1 text-[8.5px]">{citations.length}</span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3.5">
        {tab === "handoff" ? (
          handoff ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-rust/20 bg-rust-soft/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono text-[9px] uppercase tracking-[0.1em] text-rust">
                    {handoff.status.replace("_", " ")}
                  </span>
                  <RiskBadge risk={handoff.riskClass} />
                </div>
                <p className="mt-2 text-[12px] font-semibold leading-snug">
                  → {handoff.destinationQueue}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  {handoff.escalationReason}
                </p>
                {handoff.status === "pending_confirmation" ? (
                  <button
                    type="button"
                    onClick={() => void onConfirmHandoff()}
                    disabled={busy === "handoff"}
                    className="btn btn-danger mt-2.5 w-full !py-1.5 !text-[10.5px]"
                  >
                    Confirm handoff
                  </button>
                ) : (
                  <p className="mono mt-2 flex items-center gap-1 text-[8.5px] uppercase tracking-[0.08em] text-forest">
                    <Check size={9} /> {handoff.status}
                  </p>
                )}
              </div>

              <ContextSection title="Customer goal">
                <p className="text-[12px] leading-relaxed">{handoff.customerGoal}</p>
              </ContextSection>

              <ContextSection title="Summary">
                <p className="text-[12px] leading-relaxed">{handoff.summary}</p>
              </ContextSection>

              <ContextSection title="What the specialist still needs">
                <ul className="space-y-1.5">
                  {handoff.missingInformation.map((item) => (
                    <li key={item} className="flex gap-1.5 text-[12px] leading-snug">
                      <span className="mt-[6px] size-1 shrink-0 rounded-full bg-amber" />
                      {item}
                    </li>
                  ))}
                </ul>
              </ContextSection>

              <ContextSection title="Recommended next action">
                <p className="text-[12px] leading-relaxed text-muted">
                  {handoff.recommendedNextAction}
                </p>
              </ContextSection>

              <ContextSection title="Actions already attempted">
                <ul className="space-y-1.5">
                  {handoff.actionsAttempted.map((item) => (
                    <li key={item} className="flex gap-1.5 text-[12px] leading-snug">
                      <Check size={10} className="mt-0.5 shrink-0 text-forest" />
                      {item}
                    </li>
                  ))}
                </ul>
              </ContextSection>

              <ContextSection title="Claims already communicated">
                <ul className="space-y-1.5">
                  {handoff.claimsAlreadyCommunicated.map((item) => (
                    <li
                      key={item}
                      className="rounded border border-line bg-white/70 px-2 py-1.5 text-[10.5px] leading-snug text-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </ContextSection>

              <ContextSection title="Sources consulted">
                <ul className="space-y-1.5">
                  {handoff.sourcesConsulted.length ? (
                    handoff.sourcesConsulted.map((source) => (
                      <li key={source.sourceId} className="text-[12px] leading-snug">
                        <span className="font-medium">{source.title}</span>{" "}
                        {source.key ? (
                          <span className="mono text-[12px] text-muted">
                            {source.key}
                          </span>
                        ) : null}{" "}
                        <span className="mono text-[12px] text-muted">
                          v{source.version}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-[11px] text-muted">None retrieved.</li>
                  )}
                </ul>
              </ContextSection>

              <ContextSection
                title={`Transcript · ${handoff.fullTranscript.length} entries`}
              >
                <ol className="space-y-2">
                  {handoff.fullTranscript.map((entry) => (
                    <li key={entry.id} className="text-[12px] leading-relaxed">
                      <span className="font-semibold">
                        {entry.actorName ?? entry.role}:
                      </span>{" "}
                      {entry.content}
                    </li>
                  ))}
                </ol>
              </ContextSection>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
              <ShieldCheck size={24} className="text-forest" />
              <p className="text-[12px] font-medium">No handoff on this thread</p>
              <p className="text-[11px] leading-relaxed text-muted">
                The policy engine kept it with ProofDesk. Sensitive actions still
                cannot execute from chat.
              </p>
              {conversation?.decision ? (
                <DecisionBadge decision={conversation.decision} />
              ) : null}
            </div>
          )
        ) : null}

        {tab === "sources" ? (
          citations.length ? (
            <div className="space-y-2.5">
              {citations.map((citation) => (
                <div
                  key={citation.id}
                  className="rounded-xl border border-line bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11.5px] font-semibold leading-snug">
                      {citation.sourceTitle}
                    </span>
                    <span className="mono shrink-0 rounded bg-paper-2 px-1 py-0.5 text-[8px] uppercase text-muted">
                      v{citation.sourceVersion}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
                    {citation.excerpt}
                  </p>
                  <div className="mono mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[8.5px] uppercase tracking-[0.06em] text-muted">
                    <span>{citation.owner}</span>
                    <span>eff. {citation.effectiveDate}</span>
                    <span>score {citation.score.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
              <FileText size={24} className="text-muted" />
              <p className="text-[12px] font-medium">No citations</p>
              <p className="text-[11px] text-muted">
                Abstained or escalated turns carry no answer citations.
              </p>
            </div>
          )
        ) : null}

        {tab === "trace" ? (
          latestAssistant?.trace ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-white p-3">
                <p className="mono text-[9px] uppercase tracking-[0.1em] text-muted">
                  Latest decision
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {latestAssistant.decision ? (
                    <DecisionBadge decision={latestAssistant.decision} />
                  ) : null}
                  {latestAssistant.risk ? (
                    <RiskBadge risk={latestAssistant.risk} />
                  ) : null}
                </div>
                <div className="mono mt-2.5 space-y-1 text-[9.5px] text-muted">
                  <div>trace · {latestAssistant.traceId}</div>
                  <div>model · {latestAssistant.model}</div>
                  <div>latency · {latestAssistant.latencyMs}ms</div>
                  <div>
                    tokens · {latestAssistant.inputTokens ?? 0} in /{" "}
                    {latestAssistant.outputTokens ?? 0} out
                  </div>
                  <div>actions executed · none</div>
                </div>
              </div>
              <TraceList trace={latestAssistant.trace} />
              <details className="rounded-xl border border-line bg-white p-3">
                <summary className="cursor-pointer text-[10.5px] font-semibold text-muted">
                  Raw trace JSON
                </summary>
                <pre className="scroll-thin mt-2 max-h-72 overflow-auto text-[8.5px] leading-relaxed text-muted">
                  {JSON.stringify(latestAssistant.trace, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
              <Sparkles size={24} className="text-muted" />
              <p className="text-[12px] font-medium">No AI trace</p>
              <p className="text-[11px] text-muted">
                This thread has no assistant turn yet, or the last turn is a human
                reply.
              </p>
            </div>
          )
        ) : null}
      </div>
      <div className="border-t border-line p-3">
        <div className="mono flex items-center justify-between text-[8.5px] uppercase tracking-[0.08em] text-muted">
          <span className="flex items-center gap-1">
            <Clock3 size={9} /> opened {relativeTime(conversation?.createdAt ?? new Date(now).toISOString(), now)}
          </span>
          <span>{conversation?.failureCount ?? 0} abstains</span>
        </div>
      </div>
    </>
  );
}

function TraceList({ trace }: { trace: Record<string, unknown> }) {
  const signals = Array.isArray(trace.signals)
    ? (trace.signals as { code: string; label: string; severity: string }[])
    : [];
  const rules = Array.isArray(trace.rules)
    ? (trace.rules as { id: string; label: string; triggered: boolean }[])
    : [];
  const answerability = trace.answerability as
    | { score?: number; sufficient?: boolean; reasons?: string[] }
    | undefined;
  const verification = trace.verification as
    | { passed?: boolean; checkedClaims?: number; failures?: string[] }
    | undefined;
  const retrieval = trace.retrieval as
    | { mode?: string; topScore?: number; margin?: number; threshold?: number }
    | undefined;

  return (
    <>
      <ContextSection title="Policy signals">
        {signals.length ? (
          <ul className="space-y-1.5">
            {signals.map((signal) => (
              <li key={signal.code} className="flex items-start gap-1.5 text-[10.5px]">
                <span
                  className={`mt-[5px] size-1.5 shrink-0 rounded-full ${
                    signal.severity === "critical"
                      ? "bg-rust"
                      : signal.severity === "warn"
                        ? "bg-amber"
                        : "bg-forest"
                  }`}
                />
                <span>
                  <span className="font-medium">{signal.label}</span>
                  <span className="mono block text-[8.5px] uppercase text-muted">
                    {signal.code} · {signal.severity}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10.5px] text-muted">No signals recorded.</p>
        )}
      </ContextSection>
      <ContextSection title="Rules evaluated">
        <ul className="space-y-1">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between gap-2 text-[10px]"
            >
              <span className={rule.triggered ? "font-medium" : "text-muted"}>
                {rule.label}
              </span>
              <span className={rule.triggered ? "text-rust" : "text-muted"}>
                {rule.triggered ? "triggered" : "—"}
              </span>
            </li>
          ))}
        </ul>
      </ContextSection>
      <ContextSection title="Retrieval">
        <div className="mono space-y-1 text-[9.5px] text-muted">
          <div>mode · {retrieval?.mode ?? "—"}</div>
          <div>top score · {retrieval?.topScore?.toFixed(3) ?? "—"}</div>
          <div>margin · {retrieval?.margin?.toFixed(3) ?? "—"}</div>
          <div>threshold · {retrieval?.threshold?.toFixed(2) ?? "—"}</div>
        </div>
      </ContextSection>
      <ContextSection title="Answerability">
        <p className="text-[10.5px] text-muted">
          score {answerability?.score?.toFixed(2) ?? "—"} ·{" "}
          {answerability?.sufficient ? "sufficient" : "insufficient"}
        </p>
        <ul className="mt-1.5 space-y-1">
          {(answerability?.reasons ?? []).map((reason) => (
            <li key={reason} className="text-[10px] text-muted">
              · {reason}
            </li>
          ))}
        </ul>
      </ContextSection>
      <ContextSection title="Verification">
        <p className="flex items-center gap-1.5 text-[10.5px]">
          {verification?.passed ? (
            <Check size={11} className="text-forest" />
          ) : (
            <CircleAlert size={11} className="text-rust" />
          )}
          {verification?.passed ? "Passed" : "Not passed"} ·{" "}
          {verification?.checkedClaims ?? 0} claims checked
        </p>
        {(verification?.failures ?? []).map((failure) => (
          <p key={failure} className="mt-1 text-[9.5px] text-rust">
            {failure}
          </p>
        ))}
      </ContextSection>
    </>
  );
}

function ContextSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mono mb-1.5 text-[8.5px] uppercase tracking-[0.1em] text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}
