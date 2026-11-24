import type { Store } from "@/lib/database";
import type { AuditLog } from "@/lib/types";
import { newId, nowIso } from "@/lib/ids";

export async function audit(
  store: Store,
  input: {
    organizationId: string;
    actor: string;
    action: string;
    entityType: string;
    entityId: string;
    detail?: Record<string, unknown>;
  },
): Promise<AuditLog> {
  const log: AuditLog = {
    id: newId(),
    organizationId: input.organizationId,
    actor: input.actor,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    detail: input.detail ?? {},
    createdAt: nowIso(),
  };
  return store.createAuditLog(input.organizationId, log);
}
