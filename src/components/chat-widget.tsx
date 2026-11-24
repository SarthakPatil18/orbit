"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore, useState } from "react";
import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  FileCheck2,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import type { AnswerResponse } from "@/lib/types";
import { DecisionBadge, LiveDot, RiskBadge } from "./ui";

interface Turn {
  id: string;
  role: "user" | "assistant" | "note";
  text: string;
  response?: AnswerResponse;
}

const STORAGE_KEY = "proofdesk.widget.v1";

const suggestions = [
  "How do I export only paid attendees?",
  "I was charged twice for one Design Summit ticket.",
  "Can Orbit reserve our auditorium?",
  "Which roles can issue a refund?",
];

function uid(): string {
  return `t_${Math.random().toString(36).slice(2, 10)}`;
}

const greeting: Turn = {
  id: "greeting",
  role: "assistant",
  text: "Hi — I'm ProofDesk, Orbit's support desk. I answer from approved Orbit sources, show the evidence, and bring in a person when the stakes are high. What's blocking you?",
};

interface SessionState {
  turns: Turn[];
  conversationId?: string;
}

const sessionListeners = new Set<() => void>();
let sessionCache = "";

function readSessionRaw(): string {
  if (typeof window === "undefined") return sessionCache;
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return sessionCache;
  }
}

function getSessionSnapshot(): string {
  const next = readSessionRaw();
  if (next !== sessionCache) sessionCache = next;
  return sessionCache;
}

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function parseSession(raw: string): SessionState {
  if (!raw) return { turns: [greeting] };
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (Array.isArray(parsed.turns) && parsed.turns.length) {
      return {
        turns: parsed.turns,
        conversationId: parsed.conversationId,
      };
    }
  } catch {
    // Ignore malformed session state.
  }
  return { turns: [greeting] };
}

function writeSession(next: SessionState) {
  const raw = JSON.stringify({
    turns: next.turns.slice(-24),
    conversationId: next.conversationId,
  });
  sessionCache = raw;
  try {
    sessionStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage can be unavailable in private modes.
  }
  sessionListeners.forEach((listener) => listener());
}

function clearSession() {
  sessionCache = "";
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  sessionListeners.forEach((listener) => listener());
}

export function ChatWidget() {
  const sessionRaw = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => "",
  );
  const turns = parseSession(sessionRaw).turns;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, busy, open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [open]);

  const send = useCallback(
    async (raw?: string) => {
      const question = (raw ?? input).trim();
      if (!question || busy) return;
      const withQuestion = parseSession(getSessionSnapshot());
      setError(null);
      setBusy(true);
      setInput("");
      writeSession({
        turns: [...withQuestion.turns, { id: uid(), role: "user", text: question }],
        conversationId: withQuestion.conversationId,
      });
      try {
        const res = await fetch("/api/answer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            question,
            conversationId: withQuestion.conversationId,
            context: { page: "orbit.club/marketing" },
          }),
        });
        const data = (await res.json()) as AnswerResponse & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "ProofDesk could not answer that.");
        }
        const current = parseSession(getSessionSnapshot());
        writeSession({
          turns: [
            ...current.turns,
            { id: uid(), role: "assistant", text: data.answer, response: data },
          ],
          conversationId: data.conversationId,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
        const current = parseSession(getSessionSnapshot());
        writeSession({
          turns: [
            ...current.turns,
            {
              id: uid(),
              role: "note",
              text: "I couldn't reach the answer service. Nothing was changed on your account. Try again, or ask for a person and the desk will pick it up.",
            },
          ],
          conversationId: current.conversationId,
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, input],
  );

  const confirmHandoff = useCallback(async (handoffId: string) => {
    setConfirming(handoffId);
    try {
      const res = await fetch(`/api/handoffs/${handoffId}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: "Confirmed from the Orbit chat widget." }),
      });
      if (!res.ok) throw new Error("Could not confirm the handoff.");
      const current = parseSession(getSessionSnapshot());
      writeSession({
        turns: [
          ...current.turns.map((turn) =>
            turn.response?.handoffId === handoffId
              ? {
                  ...turn,
                  response: {
                    ...turn.response,
                    handoffStatus: "confirmed" as const,
                  },
                }
              : turn,
          ),
          {
            id: uid(),
            role: "note",
            text: "Handoff confirmed. It is now on the agent desk with your transcript, the sources checked, and what the specialist still needs. You won't have to repeat it.",
          },
        ],
        conversationId: current.conversationId,
      });
    } catch {
      setError("The handoff could not be confirmed. Please try again.");
    } finally {
      setConfirming(null);
    }
  }, []);

  const reset = useCallback(() => {
    clearSession();
    setError(null);
    setInput("");
  }, []);

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setUnread(false);
          }}
          className="press fixed bottom-4 right-4 z-50 flex size-12 items-center justify-center rounded-full border border-ink/10 bg-ink text-paper shadow-[0_18px_50px_-18px_rgba(17,20,17,0.7)] hover:-translate-y-0.5 sm:bottom-5 sm:right-5 sm:size-auto sm:gap-3 sm:px-4 sm:py-3"
          aria-label="Open ProofDesk support chat"
        >
          <span className="relative grid size-8 place-items-center rounded-full bg-lime text-ink">
            <MessageSquare size={16} />
            {unread ? (
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-ink bg-rust" />
            ) : null}
          </span>
          <span className="hidden pr-1 sm:block">
            <span className="block text-[12.5px] font-semibold leading-tight">
              Ask ProofDesk
            </span>
            <span className="block text-[12px] leading-tight text-paper/70">
              Cited answers · human handoff
            </span>
          </span>
        </button>
      ) : null}

      {open ? (
        <section
          className="animate-rise fixed inset-0 z-50 flex flex-col overflow-hidden border-line bg-[#fbfaf5] shadow-[0_40px_100px_-30px_rgba(17,20,17,0.6)] sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(760px,calc(100dvh-40px))] sm:w-[430px] sm:rounded-[20px] sm:border"
          aria-label="ProofDesk support chat"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line bg-[#fffdf8] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-ink text-lime">
                <Sparkles size={16} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-semibold leading-tight">
                    ProofDesk
                  </p>
                  <span className="mono rounded border border-line px-1.5 py-0.5 text-[12px] uppercase tracking-[0.08em] text-muted">
                    Orbit support
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] leading-5 text-muted">
                  <LiveDot />
                  Evidence-conditioned · answers cite sources
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                className="btn btn-ghost btn-icon"
                aria-label="Start a new conversation"
                title="New conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-icon"
                aria-label="Close chat"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          <div
            ref={bodyRef}
            className="scroll-thin flex-1 space-y-4 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {turns.map((turn) => (
              <TurnView
                key={turn.id}
                turn={turn}
                confirming={confirming}
                onConfirm={confirmHandoff}
                onAskHuman={() => send("I need a person, please.")}
              />
            ))}
            {busy ? (
              <div className="flex items-center gap-2 text-[12px] leading-5 text-muted">
                <span className="flex items-center gap-1 rounded-full bg-paper-2 px-3 py-2">
                  <span className="typing-dot size-1.5 rounded-full bg-muted" />
                  <span className="typing-dot size-1.5 rounded-full bg-muted" />
                  <span className="typing-dot size-1.5 rounded-full bg-muted" />
                </span>
                Checking sources…
              </div>
            ) : null}
            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-rust/20 bg-rust-soft px-3 py-2 text-[12px] leading-5 text-rust">
                <CircleAlert size={14} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const last = [...turns].reverse().find((turn) => turn.role === "user");
                      if (last) void send(last.text);
                    }}
                    className="btn mt-2 min-h-10 !px-3 !text-[12px]"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {turns.length <= 1 ? (
            <div className="border-t border-line/70 px-4 py-3">
              <p className="eyebrow mb-2">Try a real support case</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="min-h-10 rounded-full border border-line bg-white/70 px-3 py-2 text-left text-[12px] leading-snug text-ink-2 transition-colors hover:border-forest hover:bg-forest-soft"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="border-t border-line bg-[#fffdf8] px-4 py-4"
          >
            <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-white px-3 py-2 focus-within:border-forest">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder="Ask about events, payments, check-in…"
                className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent text-[13.5px] outline-none placeholder:text-[#9a9c93]"
                aria-label="Message ProofDesk"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink text-paper transition-colors hover:bg-forest disabled:opacity-35"
                aria-label="Send message"
              >
                <ArrowUp size={16} />
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] leading-5 text-muted">
              <ShieldCheck size={14} />
              No refunds, deletions, or payment changes run from chat.
            </p>
          </form>
        </section>
      ) : null}
    </>
  );
}

function TurnView({
  turn,
  confirming,
  onConfirm,
  onAskHuman,
}: {
  turn: Turn;
  confirming: string | null;
  onConfirm: (handoffId: string) => void;
  onAskHuman: () => void;
}) {
  const [showSources, setShowSources] = useState(true);
  const [showTrace, setShowTrace] = useState(false);

  if (turn.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[13px] leading-relaxed text-paper">
          {turn.text}
        </div>
      </div>
    );
  }

  if (turn.role === "note") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-forest/20 bg-forest-soft/60 px-3 py-2.5 text-[12px] leading-relaxed text-forest">
        <FileCheck2 size={14} className="mt-0.5 shrink-0" />
        <p>{turn.text}</p>
      </div>
    );
  }

  const response = turn.response;

  return (
    <div className="animate-fade flex items-start gap-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-forest text-paper">
        <Sparkles size={13} />
      </span>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="rounded-2xl rounded-tl-md border border-line bg-white px-3.5 py-3 text-[13px] leading-relaxed">
          <p className="whitespace-pre-wrap">{turn.text}</p>
        </div>

        {response ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <DecisionBadge decision={response.decision} />
              <RiskBadge risk={response.risk} />
              {response.decision === "abstain" ? (
                <span className="text-[12px] font-semibold text-ink">Explicit unknown</span>
              ) : null}
              {response.decision === "escalate" ? (
                <span className="text-[12px] font-semibold text-rust">Escalation</span>
              ) : null}
              <span className="text-[12px] text-muted">
                {response.model} · {response.latencyMs}ms
              </span>
            </div>

            {response.degraded || response.mode === "deterministic-fallback" ? (
              <p className="rounded-lg border border-amber/30 bg-amber-soft px-3 py-2 text-[12px] leading-5 text-amber">
                Model/provider unavailable. The approved deterministic answer was used.
              </p>
            ) : response.mode === "deterministic-demo" ? (
              <p className="text-[12px] leading-5 text-muted">
                Deterministic demo. The model provider is not called.
              </p>
            ) : null}

            {response.sources.length ? (
              <div className="rounded-xl border border-line bg-[#fffdf8]">
                <button
                  type="button"
                  onClick={() => setShowSources((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                  aria-expanded={showSources}
                >
                  <span className="flex items-center gap-2 text-[12px] font-semibold text-ink-2">
                    <FileCheck2 size={13} className="text-forest" />
                    {response.sources.length} approved source
                    {response.sources.length === 1 ? "" : "s"} cited
                  </span>
                  {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <ul className="space-y-2 border-t border-line px-3 py-2.5">
                  {response.sources.map((source) => (
                    <li key={source.id} className="text-[12px] leading-relaxed">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-ink">{source.title}</span>
                        <span className="mono rounded bg-paper-2 px-1.5 py-0.5 text-[12px] text-muted">
                          {source.key}
                        </span>
                        <span className="mono rounded bg-paper-2 px-1.5 py-0.5 text-[12px] text-muted">
                          v{source.version}
                        </span>
                        <span className="text-[12px] text-muted">
                          updated {source.effectiveDate}
                        </span>
                      </div>
                      {showSources ? (
                        <p className="mt-1 text-[12px] leading-relaxed text-muted">
                          {source.excerpt}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {response.decision === "escalate" && response.handoffId ? (
              <div className="rounded-xl border border-rust/25 bg-rust-soft/50 p-3">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-rust">
                  <UserRound size={13} />
                  Handoff ready for {response.handoffPreview?.destinationQueue}
                </div>
                <p className="mt-2 text-[12px] leading-5 text-ink-2">
                  {response.supportStatus === "offline"
                    ? "Offline human hours. The desk is staffed weekdays 09:00–18:00 IST. Your transcript is still transferred and will be waiting."
                    : "Human desk is online (weekdays 09:00–18:00 IST). Your transcript and context are transferred with this handoff."}
                </p>
                <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-ink-2">
                  {(response.handoffPreview?.includes ?? []).slice(0, 4).map((item) => (
                    <li key={item} className="flex gap-1.5">
                      <span className="mt-[6px] size-1 shrink-0 rounded-full bg-rust" />
                      {item}
                    </li>
                  ))}
                </ul>
                {response.handoffStatus === "pending_confirmation" ? (
                  <button
                    type="button"
                    onClick={() => onConfirm(response.handoffId!)}
                    disabled={confirming === response.handoffId}
                    className="btn btn-danger mt-3 min-h-10 w-full !py-2 !text-[12px]"
                  >
                    {confirming === response.handoffId
                      ? "Confirming…"
                      : "Confirm handoff — I want a person"}
                  </button>
                ) : (
                  <p className="mt-2 text-[12px] leading-5 text-rust">
                    Handoff {response.handoffStatus} · on the agent desk
                  </p>
                )}
                <a
                  href={`/desk?conversation=${response.conversationId}`}
                  className="btn mt-3 min-h-10 w-full !text-[12px]"
                >
                  Open this conversation on the agent desk
                </a>
              </div>
            ) : null}

            {response.decision === "abstain" ? (
              <button
                type="button"
                onClick={onAskHuman}
                className="btn min-h-10 w-full !py-2 !text-[12px]"
              >
                <UserRound size={13} />
                Ask for a person instead
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setShowTrace((v) => !v)}
              className="flex min-h-10 items-center gap-1 text-[12px] text-muted hover:text-ink"
              aria-expanded={showTrace}
            >
              {showTrace ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              Decision trace
            </button>
            {showTrace ? (
              <div className="space-y-1 rounded-lg border border-line bg-paper-2/60 p-2.5 text-[12px] leading-relaxed text-muted">
                <div>trace · {response.traceId}</div>
                <div>decision · {response.decision}</div>
                <div>sentiment · {response.sentiment}</div>
                <div>support · {response.supportStatus}</div>
                <div>
                  cost ·{" "}
                  {response.costBasis === "no-charge-deterministic"
                    ? "$0 (deterministic)"
                    : `$${response.estimatedCostUsd.toFixed(6)}`}
                </div>
                {response.signals.slice(0, 4).map((signal) => (
                  <div key={signal.code}>
                    signal · {signal.code} ({signal.severity})
                  </div>
                ))}
                <div>actions executed · none</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
