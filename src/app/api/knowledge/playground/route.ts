import { getStore } from "@/lib/database";
import { retrievalPlayground } from "@/lib/knowledge/sources";
import {
  assertSameOrigin,
  json,
  orgId,
  parseBody,
  route,
} from "@/lib/api/http";
import { playgroundSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return route(async () => {
    assertSameOrigin(request);
    const body = await parseBody(request, playgroundSchema);
    const store = await getStore();
    const result = await retrievalPlayground(
      store,
      orgId(),
      body.query,
      body.threshold,
    );
    return json(result);
  });
}
