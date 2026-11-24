import type {
  Agent,
  Customer,
  Handoff,
  Message,
  Queue,
} from "@/lib/types";
import { getStore } from "@/lib/database";
import { orgId } from "@/lib/api/http";
import { DeskWorkspace, type DeskRow } from "@/components/desk/desk-workspace";
import { readServerNow } from "@/lib/server-now";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agent desk",
  description:
    "ProofDesk agent desk: triage, cited threads, handoff packets, and audit.",
};

export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string | string[] }>;
}) {
  const query = await searchParams;
  const requestedId = Array.isArray(query.conversation)
    ? query.conversation[0]
    : query.conversation;
  const store = await getStore();
  const org = orgId();
  const [conversations, customers, queues, agents, handoffs] = await Promise.all([
    store.listConversations(org),
    store.listCustomers(org),
    store.listQueues(org),
    store.listAgents(org),
    store.listHandoffs(org),
  ]);

  const customerById = new Map<string, Customer>(customers.map((c) => [c.id, c]));
  const queueById = new Map<string, Queue>(queues.map((q) => [q.id, q]));
  const agentById = new Map<string, Agent>(agents.map((a) => [a.id, a]));
  const handoffById = new Map<string, Handoff>(handoffs.map((h) => [h.id, h]));

  const rows: DeskRow[] = await Promise.all(
    conversations.map(async (conversation) => {
      const messages: Message[] = await store.listMessages(org, conversation.id);
      const last = messages[messages.length - 1];
      const customer = customerById.get(conversation.customerId) ?? null;
      const handoff = conversation.handoffId
        ? handoffById.get(conversation.handoffId) ?? null
        : null;
      return {
        ...conversation,
        customer,
        queue: conversation.queueId
          ? queueById.get(conversation.queueId) ?? null
          : null,
        assignee: conversation.assignedAgentId
          ? agentById.get(conversation.assignedAgentId) ?? null
          : null,
        handoff: handoff
          ? {
              id: handoff.id,
              status: handoff.status,
              destinationQueue: handoff.destinationQueue,
              riskClass: handoff.riskClass,
            }
          : null,
        lastMessage: last
          ? { role: last.role, content: last.content, createdAt: last.createdAt }
          : null,
      };
    }),
  );
  rows.sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );

  const initialSelectedId =
    (requestedId && rows.some((row) => row.id === requestedId)
      ? requestedId
      : null) ??
    rows.find((r) => r.status === "needs_human")?.id ??
    rows[0]?.id ??
    null;
  let initialDetail = null;
  if (initialSelectedId) {
    const conversation = conversations.find((c) => c.id === initialSelectedId);
    if (conversation) {
      const [customer, messages, citations, handoff, queues, agents2] =
        await Promise.all([
          store.getCustomer(org, conversation.customerId),
          store.listMessages(org, conversation.id),
          store.listCitations(org, conversation.id),
          store.getHandoffByConversation(org, conversation.id),
          store.listQueues(org),
          store.listAgents(org),
        ]);
      initialDetail = {
        conversation,
        customer,
        messages,
        citations,
        handoff,
        queue: conversation.queueId
          ? queues.find((q) => q.id === conversation.queueId) ?? null
          : null,
        assignee: conversation.assignedAgentId
          ? agents2.find((a) => a.id === conversation.assignedAgentId) ?? null
          : null,
      };
    }
  }

  const serverNow = readServerNow();
  const counts = {
    all: rows.length,
    ai_active: rows.filter((r) => r.status === "ai_active").length,
    needs_human: rows.filter((r) => r.status === "needs_human").length,
    human_owned: rows.filter((r) => r.status === "human_owned").length,
    resolved: rows.filter((r) => r.status === "resolved").length,
  };

  return (
    <DeskWorkspace
      initialRows={rows}
      counts={counts}
      agents={agents}
      initialDetail={initialDetail}
      initialSelectedId={initialSelectedId}
      preferDetail={Boolean(requestedId && requestedId === initialSelectedId)}
      serverNow={serverNow}
    />
  );
}
