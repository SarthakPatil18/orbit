import { getStore } from "@/lib/database";
import { createSource, sourceFlags } from "@/lib/knowledge/sources";
import {
  assertSameOrigin,
  json,
  orgId,
  parseBody,
  route,
} from "@/lib/api/http";
import { sourceCreateSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  return route(async () => {
    const store = await getStore();
    const org = orgId();
    const [sources, chunks] = await Promise.all([
      store.listSources(org),
      store.listChunks(org),
    ]);
    return json({
      sources: sources
        .map((source) => ({
          ...source,
          flags: sourceFlags(source, sources),
          chunkCount: chunks.filter((chunk) => chunk.sourceId === source.id).length,
        }))
        .sort((a, b) => a.title.localeCompare(b.title)),
      snapshot: chunks.length,
    });
  });
}

export async function POST(request: Request) {
  return route(async () => {
    assertSameOrigin(request);
    const body = await parseBody(request, sourceCreateSchema);
    const store = await getStore();
    const source = await createSource(store, orgId(), body);
    return json({ source }, { status: 201 });
  });
}
