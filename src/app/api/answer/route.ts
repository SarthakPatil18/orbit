import { z } from "zod";
import { answerQuestion } from "@/lib/ai/answer";
import { getStore } from "@/lib/database";
import { orgId, route, json, parseBody, assertSameOrigin, ApiError } from "@/lib/api/http";
import { checkRateLimit, clientKey } from "@/lib/api/rate-limit";
import { answerSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  customerId: z.string().uuid().optional(),
  page: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  return route(async () => {
    assertSameOrigin(request);
    const limit = checkRateLimit(clientKey(request, "answer"), 30, 60_000);
    if (!limit.allowed) {
      throw new ApiError(
        "Too many questions in a short window. Try again in a minute.",
        429,
        "rate_limited",
        { resetAt: new Date(limit.resetAt).toISOString() },
      );
    }
    const url = new URL(request.url);
    const query = querySchema.parse({
      customerId: url.searchParams.get("customerId") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
    });
    const body = await parseBody(request, answerSchema);
    const store = await getStore();
    const response = await answerQuestion({
      store,
      orgId: orgId(),
      question: body.question,
      conversationId: body.conversationId,
      customerId: body.customerId ?? query.customerId,
      context: {
        page: body.context?.page ?? query.page,
        customerId: body.context?.customerId,
      },
      useModel: body.useModel,
    });
    return json(response);
  });
}
