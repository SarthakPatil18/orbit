import { getStore } from "@/lib/database";
import { ApiError, json, orgId, route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const { id } = await params;
    const store = await getStore();
    const org = orgId();
    const conversation = await store.getConversation(org, id);
    if (!conversation) throw new ApiError("Conversation not found.", 404, "not_found");
    const [customer, messages, citations, handoff, queues, agents] =
      await Promise.all([
        store.getCustomer(org, conversation.customerId),
        store.listMessages(org, conversation.id),
        store.listCitations(org, conversation.id),
        store.getHandoffByConversation(org, conversation.id),
        store.listQueues(org),
        store.listAgents(org),
      ]);
    return json({
      conversation,
      customer,
      messages,
      citations,
      handoff,
      queue: conversation.queueId
        ? queues.find((q) => q.id === conversation.queueId) ?? null
        : null,
      assignee: conversation.assignedAgentId
        ? agents.find((a) => a.id === conversation.assignedAgentId) ?? null
        : null,
    });
  });
}
