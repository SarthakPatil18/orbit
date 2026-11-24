import { getStore } from "@/lib/database";
import { newId, nowIso } from "@/lib/ids";
import type { Message } from "@/lib/types";
import { audit } from "@/lib/support/audit";
import {
  ApiError,
  assertSameOrigin,
  json,
  orgId,
  parseBody,
  route,
} from "@/lib/api/http";
import { checkRateLimit, clientKey } from "@/lib/api/rate-limit";
import { conversationActionSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    assertSameOrigin(request);
    const limit = checkRateLimit(clientKey(request, "conversation-action"), 60, 60_000);
    if (!limit.allowed) throw new ApiError("Too many actions.", 429, "rate_limited");
    const { id } = await params;
    const body = await parseBody(request, conversationActionSchema);
    const store = await getStore();
    const org = orgId();
    const conversation = await store.getConversation(org, id);
    if (!conversation) throw new ApiError("Conversation not found.", 404, "not_found");

    let message: Message | null = null;

    switch (body.action) {
      case "claim":
      case "assign": {
        const agent = await store.getAgent(org, body.agentId);
        if (!agent) throw new ApiError("Agent not found.", 404, "not_found");
        const updated = await store.updateConversation(org, id, {
          assignedAgentId: agent.id,
          status: "human_owned",
        });
        await audit(store, {
          organizationId: org,
          actor: agent.name,
          action: "conversation.claimed",
          entityType: "conversation",
          entityId: id,
          detail: { agentId: agent.id },
        });
        return json({ conversation: updated, agent });
      }
      case "reply": {
        const agent = await store.getAgent(org, body.agentId);
        if (!agent) throw new ApiError("Agent not found.", 404, "not_found");
        message = {
          id: newId(),
          organizationId: org,
          conversationId: id,
          role: "agent",
          content: body.content,
          decision: null,
          risk: null,
          model: null,
          promptVersion: null,
          policyVersion: null,
          knowledgeSnapshotVersion: null,
          latencyMs: null,
          inputTokens: null,
          outputTokens: null,
          estimatedCostUsd: null,
          traceId: null,
          trace: null,
          createdAt: nowIso(),
        };
        await store.createMessage(org, message);
        const updated = await store.updateConversation(org, id, {
          assignedAgentId: agent.id,
          status: body.resolve ? "resolved" : "human_owned",
          lastMessageAt: message.createdAt,
        });
        await audit(store, {
          organizationId: org,
          actor: agent.name,
          action: body.resolve ? "conversation.replied_and_resolved" : "conversation.replied",
          entityType: "conversation",
          entityId: id,
          detail: { messageId: message.id },
        });
        return json({ conversation: updated, message });
      }
      case "resolve": {
        const agent = body.agentId
          ? await store.getAgent(org, body.agentId)
          : null;
        const updated = await store.updateConversation(org, id, {
          status: "resolved",
          ...(agent ? { assignedAgentId: agent.id } : {}),
        });
        await audit(store, {
          organizationId: org,
          actor: agent?.name ?? "Desk operator",
          action: "conversation.resolved",
          entityType: "conversation",
          entityId: id,
          detail: {},
        });
        return json({ conversation: updated });
      }
      case "reopen": {
        const agent = body.agentId
          ? await store.getAgent(org, body.agentId)
          : null;
        const updated = await store.updateConversation(org, id, {
          status: agent ? "human_owned" : "ai_active",
          ...(agent ? { assignedAgentId: agent.id } : {}),
        });
        await audit(store, {
          organizationId: org,
          actor: agent?.name ?? "Desk operator",
          action: "conversation.reopened",
          entityType: "conversation",
          entityId: id,
          detail: {},
        });
        return json({ conversation: updated });
      }
    }
  });
}
