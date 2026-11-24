import type {
  Conversation,
  Customer,
  Handoff,
  Message,
  RetrievedChunk,
  RetrievalResult,
  TranscriptEntry,
} from "@/lib/types";
import { newId, nowIso } from "@/lib/ids";
import type { PolicyOutcome } from "./policy";
import { publicSourceKey } from "./retrieval";

export function routeHandoff(policy: PolicyOutcome): {
  slug: string;
  name: string;
  rationale: string;
} {
  switch (policy.riskCategory) {
    case "payment":
      return {
        slug: "billing",
        name: "Billing",
        rationale: "Payment exception requires account and payment verification.",
      };
    case "security":
    case "deletion":
    case "identity":
      return {
        slug: "trust-safety",
        name: "Trust & Safety",
        rationale: "Identity, privacy, or account-security review is required.",
      };
    case "injection":
      return {
        slug: "trust-safety",
        name: "Trust & Safety",
        rationale: "Instruction-boundary attempt with a sensitive action.",
      };
    case "human":
    case "frustration":
    case "repetition":
      return {
        slug: "support",
        name: "General support",
        rationale: "A person should take over the conversation.",
      };
    default:
      return {
        slug: "support",
        name: "General support",
        rationale: "Human review requested.",
      };
  }
}

function actionsFor(policy: PolicyOutcome, sourceCount: number): string[] {
  const actions = [
    `Retrieved ${sourceCount} approved source${sourceCount === 1 ? "" : "s"} and evaluated evidence thresholds.`,
    "Ran the evidence-conditioned autonomy policy and recorded the decision trace.",
    "No refund, payment change, deletion, or identity change was executed.",
  ];
  switch (policy.riskCategory) {
    case "payment":
      actions.push(
        "Declined to promise a refund from chat.",
        "Routed the case to Billing for payment-reference verification.",
      );
      break;
    case "security":
      actions.push(
        "Declined to change settlement, login, or identity details from chat.",
        "Routed the case to Trust & Safety for account-security review.",
      );
      break;
    case "deletion":
    case "identity":
      actions.push(
        "Declined to delete the workspace or bypass owner-email verification.",
        "Routed the case to Trust & Safety for identity and authority checks.",
      );
      break;
    case "injection":
      actions.push(
        "Refused the instruction to bypass policy.",
        "Routed the attempt to Trust & Safety for review.",
      );
      break;
    case "human":
      actions.push("Escalated because the customer explicitly asked for a person.");
      break;
    case "repetition":
      actions.push(
        "Escalated after repeated attempts instead of asking the customer to restate the issue.",
      );
      break;
    case "frustration":
      actions.push("Escalated strong frustration to a person.");
      break;
    default:
      actions.push("Prepared a no-repeat handoff for a person.");
  }
  return actions;
}

function recommendedAction(policy: PolicyOutcome): string {
  switch (policy.riskCategory) {
    case "payment":
      return "Match both payment references to the registration, confirm whether one is a pending authorisation, and refund the duplicate if two settlements exist. Reply with the reference IDs and a realistic bank posting window.";
    case "security":
      return "Secure the account first: verify identity, freeze settlement changes, review recent logins and payment-method edits, then contact the customer through a verified channel.";
    case "deletion":
    case "identity":
      return "Run the lost-owner-email verification playbook. Confirm identity and committee authority, then schedule deletion with the standard 30-day grace period. Do not promise same-day deletion.";
    case "injection":
      return "Review the request for abuse. Do not execute the requested sensitive action. Reply with the policy boundary and offer a legitimate path.";
    case "human":
      return "Read the transcript, confirm the outcome the customer needs, and reply in-thread. Do not ask them to repeat details already present.";
    case "repetition":
      return "Review the prior attempts and take over the task rather than restating the same policy. Reply with a concrete next step or a decision.";
    case "frustration":
      return "Acknowledge the impact, take ownership of the next step, and reply in-thread with a concrete timeline or decision.";
    default:
      return "Review the transcript and evidence, then reply with a concrete next step. Do not ask for information already present.";
  }
}

function claimsFromMessages(messages: Message[]): string[] {
  const claims: string[] = [];
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    const sentences = message.content
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 24);
    for (const sentence of sentences) {
      if (!claims.includes(sentence)) claims.push(sentence);
    }
  }
  return claims.slice(0, 6);
}

export function buildHandoffPacket(input: {
  conversation: Conversation;
  customer: Customer;
  question: string;
  assistantAnswer: string;
  policy: PolicyOutcome;
  retrieval: RetrievalResult;
  messages: Message[];
  queueName: string;
  queueId: string;
}): Handoff {
  const {
    conversation,
    customer,
    question,
    assistantAnswer,
    policy,
    retrieval,
    messages,
    queueName,
    queueId,
  } = input;
  const consulted = retrieval.candidates.slice(0, 4).map((c: RetrievedChunk) => ({
    sourceId: c.sourceId,
    title: c.sourceTitle,
    version: c.version,
    key: publicSourceKey(c.sourceSlug),
  }));
  const transcript: TranscriptEntry[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
    decision: m.decision,
    actorName:
      m.role === "assistant"
        ? "ProofDesk"
        : m.role === "system"
          ? "System"
          : m.role === "agent"
            ? "Agent"
            : customer.name,
  }));
  const summary = `${customer.name} from ${customer.club} asked: “${question}”. ${policy.reason ?? "Human review requested."} ${assistantAnswer
    .replace(/\s+/g, " ")
    .slice(0, 180)}${assistantAnswer.length > 180 ? "…" : ""}`;
  const missing = policy.missingInformation.length
    ? policy.missingInformation
    : ["Account or workspace verification"];

  return {
    id: newId(),
    organizationId: conversation.organizationId,
    conversationId: conversation.id,
    queueId,
    customerGoal: question,
    summary,
    escalationReason: policy.reason ?? "Human review requested",
    riskClass: policy.risk,
    sentiment: policy.sentiment,
    actionsAttempted: actionsFor(policy, retrieval.candidates.length),
    sourcesConsulted: consulted,
    claimsAlreadyCommunicated: claimsFromMessages(messages),
    missingInformation: missing,
    recommendedNextAction: recommendedAction(policy),
    destinationQueue: queueName,
    fullTranscript: transcript,
    status: "pending_confirmation",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function handoffRationale(policy: PolicyOutcome): string {
  return routeHandoff(policy).rationale;
}
