import { getStore } from "@/lib/database";
import { json, orgId, route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return route(async () => {
    const limitParam = new URL(request.url).searchParams.get("limit");
    const limit = Math.min(200, Math.max(1, Number(limitParam ?? 60) || 60));
    const store = await getStore();
    const logs = await store.listAuditLogs(orgId(), limit);
    return json({ logs });
  });
}
