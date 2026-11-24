import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  EvalCase,
  EvalMetrics,
  Handoff,
  TranscriptEntry,
} from "@/lib/types";

const createdAt = timestamp("created_at", { withTimezone: true, mode: "string" })
  .notNull()
  .defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true, mode: "string" })
  .notNull()
  .defaultNow();

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("pro"),
  billingStatus: text("billing_status").notNull().default("active"),
  periodEnd: text("period_end"),
  ownerEmail: text("owner_email").notNull(),
  supportHours: text("support_hours").notNull(),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  createdAt,
  updatedAt,
});

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    initials: text("initials").notNull(),
    color: text("color").notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("agents_org_idx").on(t.organizationId)],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    club: text("club").notNull(),
    role: text("role").notNull(),
    plan: text("plan").notNull().default("pro"),
    billingStatus: text("billing_status").notNull().default("active"),
    periodEnd: text("period_end"),
    workspaceCreatedAt: timestamp("workspace_created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    lastActiveAt: timestamp("last_active_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    draftEventName: text("draft_event_name"),
    draftUpdatedAt: timestamp("draft_updated_at", {
      withTimezone: true,
      mode: "string",
    }),
    upcomingEventName: text("upcoming_event_name"),
    upcomingEventDate: timestamp("upcoming_event_date", {
      withTimezone: true,
      mode: "string",
    }),
    emailOptOut: integer("email_opt_out").notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [index("customers_org_idx").on(t.organizationId)],
);

export const queues = pgTable(
  "queues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    slaMinutes: integer("sla_minutes").notNull().default(60),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex("queues_org_slug_idx").on(t.organizationId, t.slug)],
);

export const knowledgeSources = pgTable(
  "knowledge_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    version: text("version").notNull(),
    owner: text("owner").notNull(),
    authority: text("authority").notNull(),
    effectiveDate: text("effective_date").notNull(),
    lastIndexedAt: timestamp("last_indexed_at", {
      withTimezone: true,
      mode: "string",
    }),
    status: text("status").notNull().default("active"),
    summary: text("summary").notNull(),
    approvedAnswer: text("approved_answer").notNull(),
    body: text("body").notNull(),
    conflictGroup: text("conflict_group"),
    staleAfterDays: integer("stale_after_days").notNull().default(180),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("knowledge_sources_org_slug_idx").on(t.organizationId, t.slug),
    index("knowledge_sources_org_idx").on(t.organizationId),
  ],
);

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    heading: text("heading").notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count").notNull(),
    createdAt,
  },
  (t) => [
    index("knowledge_chunks_source_idx").on(t.sourceId),
    index("knowledge_chunks_org_idx").on(t.organizationId),
  ],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    queueId: uuid("queue_id").references(() => queues.id),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("ai_active"),
    risk: text("risk").notNull().default("low"),
    sentiment: text("sentiment").notNull().default("calm"),
    decision: text("decision"),
    assignedAgentId: uuid("assigned_agent_id").references(() => agents.id),
    handoffId: uuid("handoff_id"),
    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    lastCustomerQuestion: text("last_customer_question"),
    page: text("page"),
    failureCount: integer("failure_count").notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("conversations_org_status_idx").on(t.organizationId, t.status),
    index("conversations_customer_idx").on(t.customerId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    decision: text("decision"),
    risk: text("risk"),
    model: text("model"),
    promptVersion: text("prompt_version"),
    policyVersion: text("policy_version"),
    knowledgeSnapshotVersion: text("knowledge_snapshot_version"),
    latencyMs: integer("latency_ms"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    estimatedCostUsd: numeric("estimated_cost_usd", { precision: 12, scale: 8 }),
    traceId: text("trace_id"),
    trace: jsonb("trace").$type<Record<string, unknown>>(),
    createdAt,
  },
  (t) => [
    index("messages_conversation_idx").on(t.conversationId),
    index("messages_org_idx").on(t.organizationId),
  ],
);

export const citations = pgTable(
  "citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").notNull(),
    chunkId: uuid("chunk_id").notNull(),
    sourceTitle: text("source_title").notNull(),
    excerpt: text("excerpt").notNull(),
    sourceVersion: text("source_version").notNull(),
    effectiveDate: text("effective_date").notNull(),
    owner: text("owner").notNull(),
    score: numeric("score", { precision: 6, scale: 4 }).notNull(),
    createdAt,
  },
  (t) => [index("citations_message_idx").on(t.messageId)],
);

export const handoffs = pgTable(
  "handoffs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    queueId: uuid("queue_id")
      .notNull()
      .references(() => queues.id),
    customerGoal: text("customer_goal").notNull(),
    summary: text("summary").notNull(),
    escalationReason: text("escalation_reason").notNull(),
    riskClass: text("risk_class").notNull(),
    sentiment: text("sentiment").notNull(),
    actionsAttempted: jsonb("actions_attempted").$type<string[]>().notNull(),
    sourcesConsulted: jsonb("sources_consulted")
      .$type<Handoff["sourcesConsulted"]>()
      .notNull(),
    claimsAlreadyCommunicated: jsonb("claims_already_communicated")
      .$type<string[]>()
      .notNull(),
    missingInformation: jsonb("missing_information")
      .$type<string[]>()
      .notNull(),
    recommendedNextAction: text("recommended_next_action").notNull(),
    destinationQueue: text("destination_queue").notNull(),
    fullTranscript: jsonb("full_transcript")
      .$type<TranscriptEntry[]>()
      .notNull(),
    status: text("status").notNull().default("pending_confirmation"),
    createdAt,
    updatedAt,
  },
  (t) => [index("handoffs_conversation_idx").on(t.conversationId)],
);

export const customerEvents = pgTable(
  "customer_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt,
  },
  (t) => [index("customer_events_org_type_idx").on(t.organizationId, t.type)],
);

export const journeys = pgTable(
  "journeys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    triggerEvent: text("trigger_event").notNull(),
    condition: text("condition").notNull(),
    timing: text("timing").notNull(),
    subject: text("subject").notNull(),
    preheader: text("preheader").notNull(),
    primaryAction: text("primary_action").notNull(),
    exitRules: jsonb("exit_rules").$type<string[]>().notNull(),
    entryLimit: text("entry_limit"),
    emailKind: text("email_kind").notNull(),
    status: text("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex("journeys_org_key_idx").on(t.organizationId, t.key)],
);

export const journeyEnrollments = pgTable(
  "journey_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    suppressionReason: text("suppression_reason"),
    dedupeKey: text("dedupe_key"),
    enteredAt: timestamp("entered_at", { withTimezone: true, mode: "string" })
      .notNull(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "string",
    }),
    updatedAt,
  },
  (t) => [
    index("journey_enrollments_org_idx").on(t.organizationId),
    index("journey_enrollments_journey_idx").on(t.journeyId),
  ],
);

export const journeyRuns = pgTable(
  "journey_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id").references(() => journeyEnrollments.id, {
      onDelete: "set null",
    }),
    eventType: text("event_type").notNull(),
    eventPayload: jsonb("event_payload").$type<Record<string, unknown>>().notNull(),
    status: text("status").notNull(),
    detail: text("detail").notNull(),
    createdAt,
  },
  (t) => [index("journey_runs_org_idx").on(t.organizationId)],
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => journeyEnrollments.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    recipient: text("recipient").notNull(),
    subject: text("subject").notNull(),
    preheader: text("preheader").notNull(),
    html: text("html").notNull(),
    text: text("text").notNull(),
    status: text("status").notNull(),
    provider: text("provider").notNull(),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    scheduledFor: timestamp("scheduled_for", {
      withTimezone: true,
      mode: "string",
    }),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" }),
    createdAt,
    updatedAt,
  },
  (t) => [index("deliveries_org_idx").on(t.organizationId)],
);

export const evalCases = pgTable(
  "eval_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    caseKey: text("case_key").notNull(),
    category: text("category").notNull(),
    question: text("question").notNull(),
    priorTurns: jsonb("prior_turns")
      .$type<EvalCase["priorTurns"]>()
      .notNull(),
    context: jsonb("context").$type<Record<string, unknown>>().notNull(),
    expectedDecision: text("expected_decision").notNull(),
    expectedSourceIds: jsonb("expected_source_ids").$type<string[]>().notNull(),
    expectedRisk: text("expected_risk").notNull(),
    forbiddenActions: jsonb("forbidden_actions").$type<string[]>().notNull(),
    notes: text("notes").notNull(),
    createdAt,
  },
  (t) => [
    uniqueIndex("eval_cases_org_key_idx").on(t.organizationId, t.caseKey),
  ],
);

export const evalRuns = pgTable(
  "eval_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    release: text("release").notNull(),
    status: text("status").notNull(),
    total: integer("total").notNull().default(0),
    passed: integer("passed").notNull().default(0),
    metrics: jsonb("metrics").$type<EvalMetrics>().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "string" })
      .notNull(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt,
  },
  (t) => [index("eval_runs_org_idx").on(t.organizationId)],
);

export const evalResults = pgTable(
  "eval_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    runId: uuid("run_id")
      .notNull()
      .references(() => evalRuns.id, { onDelete: "cascade" }),
    caseId: uuid("case_id")
      .notNull()
      .references(() => evalCases.id, { onDelete: "cascade" }),
    caseKey: text("case_key").notNull(),
    category: text("category").notNull(),
    question: text("question").notNull(),
    decision: text("decision").notNull(),
    risk: text("risk").notNull(),
    sourceIds: jsonb("source_ids").$type<string[]>().notNull(),
    passed: integer("passed").notNull(),
    failures: jsonb("failures").$type<string[]>().notNull(),
    latencyMs: integer("latency_ms").notNull(),
    trace: jsonb("trace").$type<Record<string, unknown>>().notNull(),
    createdAt,
  },
  (t) => [index("eval_results_run_idx").on(t.runId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull(),
    createdAt,
  },
  (t) => [index("audit_logs_org_created_idx").on(t.organizationId, t.createdAt)],
);
