import { z } from "zod";
import { getStore } from "@/lib/database";
import { orgId, route, json, parseQuery } from "@/lib/api/http";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  status: z
    .enum(["all", "ai_active", "needs_human", "human_owned", "resolved"])
    .optional()
    .default("all"),
  q: z.string().max(120).optional(),
});

export async function GET(request: Request) {
  return route(async () => {
    const url = new URL(request.url);
    const query = parseQuery(url, querySchema);
    const store = await getStore();
    const id = orgId();
    const [conversations, customers, queues, agents, handoffs] = await Promise.all([
      store.listConversations(id),
      store.listCustomers(id),
      store.listQueues(id),
      store.listAgents(id),
      store.listHandoffs(id),
    ]);
    const customerById = new Map(customers.map((c) => [c.id, c]));
    const queueById = new Map(queues.map((q) => [q.id, q]));
    const agentById = new Map(agents.map((a) => [a.id, a]));
    const handoffById = new Map(handoffs.map((h) => [h.id, h]));

    const rows = await Promise.all(
      conversations.map(async (conversation) => {
        const messages = await store.listMessages(id, conversation.id);
        const last = messages[messages.length - 1] ?? null;
        const customer = customerById.get(conversation.customerId) ?? null;
        const queue = conversation.queueId
          ? queueById.get(conversation.queueId) ?? null
          : null;
        const assignee = conversation.assignedAgentId
          ? agentById.get(conversation.assignedAgentId) ?? null
          : null;
        const handoff = conversation.handoffId
          ? handoffById.get(conversation.handoffId) ?? null
          : null;
        return {
          ...conversation,
          customer,
          queue,
          assignee,
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

    const needle = query.q?.toLowerCase().trim();
    const filtered = rows
      .filter((row) =>
        query.status === "all" ? true : row.status === query.status,
      )
      .filter((row) => {
        if (!needle) return true;
        return (
          row.subject.toLowerCase().includes(needle) ||
          (row.lastCustomerQuestion ?? "").toLowerCase().includes(needle) ||
          (row.customer?.name ?? "").toLowerCase().includes(needle) ||
          (row.customer?.club ?? "").toLowerCase().includes(needle) ||
          (row.lastMessage?.content ?? "").toLowerCase().includes(needle)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );

    return json({
      conversations: filtered,
      counts: {
        all: rows.length,
        ai_active: rows.filter((r) => r.status === "ai_active").length,
        needs_human: rows.filter((r) => r.status === "needs_human").length,
        human_owned: rows.filter((r) => r.status === "human_owned").length,
        resolved: rows.filter((r) => r.status === "resolved").length,
      },
    });
  });
}
