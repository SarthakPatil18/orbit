import { getStore } from "@/lib/database";
import { assertSameOrigin, json, route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return route(async () => {
    assertSameOrigin(request);
    const store = await getStore();
    await store.reset();
    return json({ ok: true, resetAt: new Date().toISOString() });
  });
}
