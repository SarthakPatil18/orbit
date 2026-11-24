import { getStore } from "@/lib/store";
import { retrievalPlayground } from "@/lib/services/knowledge";
import {
  assertSameOrigin,
  json,
  orgId,
  parseBody,
  route,
} from "@/lib/api/http";
import { playgroundSchema } from "@/lib/api/validation";

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
