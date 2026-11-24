import { getStore } from "@/lib/database";
import { reindexSource } from "@/lib/knowledge/sources";
import { assertSameOrigin, json, orgId, route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    assertSameOrigin(request);
    const { id } = await params;
    const store = await getStore();
    const source = await reindexSource(store, orgId(), id);
    const chunks = await store.listChunks(orgId(), id);
    return json({ source, chunkCount: chunks.length });
  });
}
