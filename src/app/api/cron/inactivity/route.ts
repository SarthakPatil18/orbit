import { emitInactivityEvents } from "@/lib/services/lifecycle";
import { getStore } from "@/lib/store";
import {
  json,
  orgId,
  requireCronSecret,
  route,
} from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return route(async () => {
    requireCronSecret(request);
    const store = await getStore();
    const result = await emitInactivityEvents(store, orgId());
    return json({
      ok: true,
      scanned: result.scanned,
      emitted: result.emitted,
      results: result.results,
    });
  });
}
