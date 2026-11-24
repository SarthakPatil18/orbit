import { z } from "zod";
import { LIFECYCLE_EVENTS } from "@/lib/email/lifecycle";

const uuid = z.string().uuid();
const record = z.record(z.string(), z.unknown());

export const answerSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, "Ask a question with at least two characters.")
    .max(2000, "Keep the question under 2,000 characters."),
  conversationId: uuid.optional(),
  customerId: uuid.optional(),
  context: z
    .object({
      page: z.string().max(120).optional(),
      customerId: uuid.optional(),
    })
    .optional(),
  useModel: z.boolean().optional(),
});

export const conversationActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("claim"),
    agentId: uuid,
  }),
  z.object({
    action: z.literal("reply"),
    agentId: uuid,
    content: z.string().trim().min(1).max(4000),
    resolve: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("resolve"),
    agentId: uuid.optional(),
  }),
  z.object({
    action: z.literal("reopen"),
    agentId: uuid.optional(),
  }),
  z.object({
    action: z.literal("assign"),
    agentId: uuid,
  }),
]);

export const handoffConfirmSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

export const lifecycleEventSchema = z.object({
  type: z.enum(LIFECYCLE_EVENTS),
  customerId: uuid,
  payload: record.default({}),
  occurredAt: z.string().datetime().optional(),
});

export const evalRunSchema = z.object({
  label: z.string().trim().max(120).optional(),
  release: z.string().trim().max(60).optional(),
});

export const journeyPatchSchema = z
  .object({
    status: z.enum(["active", "paused", "draft"]).optional(),
    subject: z.string().trim().min(1).max(180).optional(),
    preheader: z.string().trim().min(1).max(240).optional(),
    condition: z.string().trim().min(1).max(400).optional(),
    timing: z.string().trim().min(1).max(200).optional(),
    exitRules: z.array(z.string().trim().min(1).max(160)).max(12).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const sourceCreateSchema = z.object({
  type: z.enum(["product", "policy", "legal", "engineering"]),
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().max(160).optional(),
  version: z.string().trim().min(1).max(40),
  owner: z.string().trim().min(2).max(80),
  authority: z.enum(["canonical", "approved", "reference"]),
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
  summary: z.string().trim().min(10).max(400),
  approvedAnswer: z.string().trim().min(20).max(4000),
  body: z.string().trim().min(20).max(20000),
  status: z.enum(["active", "draft", "stale", "archived"]).optional(),
  conflictGroup: z.string().trim().max(80).nullable().optional(),
  staleAfterDays: z.number().int().min(1).max(3650).optional(),
});

export const sourceUpdateSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    version: z.string().trim().min(1).max(40).optional(),
    owner: z.string().trim().min(2).max(80).optional(),
    authority: z.enum(["canonical", "approved", "reference"]).optional(),
    effectiveDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
      .optional(),
    summary: z.string().trim().min(10).max(400).optional(),
    approvedAnswer: z.string().trim().min(20).max(4000).optional(),
    body: z.string().trim().min(20).max(20000).optional(),
    status: z.enum(["active", "draft", "stale", "archived"]).optional(),
    conflictGroup: z.string().trim().max(80).nullable().optional(),
    staleAfterDays: z.number().int().min(1).max(3650).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const playgroundSchema = z.object({
  query: z.string().trim().min(2).max(500),
  threshold: z.number().min(0).max(1).optional(),
});

export const cronSchema = z.object({
  now: z.string().datetime().optional(),
});

export type AnswerInput = z.infer<typeof answerSchema>;
export type LifecycleEventInputBody = z.infer<typeof lifecycleEventSchema>;
