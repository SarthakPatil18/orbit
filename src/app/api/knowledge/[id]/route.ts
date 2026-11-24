import { getStore } from "@/lib/store";
import {
  archiveSource,
  sourceFlags,
  updateSource,
} from "@/lib/services/knowledge";
import {
  ApiError,
  assertSameOrigin,
  json,
  orgId,
  parseBody,
  route,
} from "@/lib/api/http";
import { sourceUpdateSchema } from "@/lib/api/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const { id } = await params;
    const store = await getStore();
    const org = orgId();
    const [source, sources, chunks] = await Promise.all([
      store.getSourceById(org, id),
      store.listSources(org),
      store.listChunks(org, id),
    ]);
    if (!source) throw new ApiError("Source not found.", 404, "not_found");
    return json({
      source: {
        ...source,
        flags: sourceFlags(source, sources),
        chunks,
      },
    });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    assertSameOrigin(request);
    const { id } = await params;
    const body = await parseBody(request, sourceUpdateSchema);
    const store = await getStore();
    const source = await updateSource(store, orgId(), id, body);
    return json({ source });
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    assertSameOrigin(request);
    const { id } = await params;
    const store = await getStore();
    const source = await archiveSource(store, orgId(), id);
    return json({ source });
  });
}
