import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { getDb, closeDb, schema } from "@/lib/database/client";
import type {
  Agent,
  AuditLog,
  Citation,
  Conversation,
  Customer,
  CustomerEvent,
  Delivery,
  EvalCase,
  EvalResult,
  EvalRun,
  Handoff,
  Journey,
  JourneyEnrollment,
  JourneyRun,
  KnowledgeChunk,
  KnowledgeSource,
  Message,
  Organization,
  Queue,
} from "@/lib/types";
import { createSeedData } from "@/data/seed";
import type { Store } from "./contract";

type Row<T extends { $inferSelect: unknown }> = T["$inferSelect"];

function mapOrganization(row: Row<typeof schema.organizations>): Organization {
  return {
    ...row,
    plan: row.plan as Organization["plan"],
    billingStatus: row.billingStatus as Organization["billingStatus"],
  };
}

function mapAgent(row: Row<typeof schema.agents>): Agent {
  return { ...row, role: row.role as Agent["role"] };
}

function mapCustomer(row: Row<typeof schema.customers>): Customer {
  return {
    ...row,
    role: row.role as Customer["role"],
    plan: row.plan as Customer["plan"],
    billingStatus: row.billingStatus as Customer["billingStatus"],
    emailOptOut: Boolean(row.emailOptOut),
  };
}

function mapQueue(row: Row<typeof schema.queues>): Queue {
  return row;
}

function mapSource(row: Row<typeof schema.knowledgeSources>): KnowledgeSource {
  return {
    ...row,
    type: row.type as KnowledgeSource["type"],
    status: row.status as KnowledgeSource["status"],
    authority: row.authority as KnowledgeSource["authority"],
  };
}

function mapChunk(row: Row<typeof schema.knowledgeChunks>): KnowledgeChunk {
  return row;
}

function mapConversation(row: Row<typeof schema.conversations>): Conversation {
  return {
    ...row,
    status: row.status as Conversation["status"],
    risk: row.risk as Conversation["risk"],
    sentiment: row.sentiment as Conversation["sentiment"],
    decision: row.decision as Conversation["decision"],
  };
}

function mapMessage(row: Row<typeof schema.messages>): Message {
  return {
    ...row,
    role: row.role as Message["role"],
    decision: row.decision as Message["decision"],
    risk: row.risk as Message["risk"],
    estimatedCostUsd:
      row.estimatedCostUsd === null ? null : Number(row.estimatedCostUsd),
  };
}

function mapCitation(row: Row<typeof schema.citations>): Citation {
  return { ...row, score: Number(row.score) };
}

function mapHandoff(row: Row<typeof schema.handoffs>): Handoff {
  return {
    ...row,
    riskClass: row.riskClass as Handoff["riskClass"],
    sentiment: row.sentiment as Handoff["sentiment"],
    status: row.status as Handoff["status"],
  };
}

function mapCustomerEvent(
  row: Row<typeof schema.customerEvents>,
): CustomerEvent {
  return row;
}

function mapJourney(row: Row<typeof schema.journeys>): Journey {
  return {
    ...row,
    emailKind: row.emailKind as Journey["emailKind"],
    status: row.status as Journey["status"],
  };
}

function mapEnrollment(
  row: Row<typeof schema.journeyEnrollments>,
): JourneyEnrollment {
  return { ...row, status: row.status as JourneyEnrollment["status"] };
}

function mapJourneyRun(row: Row<typeof schema.journeyRuns>): JourneyRun {
  return { ...row, status: row.status as JourneyRun["status"] };
}

function mapDelivery(row: Row<typeof schema.deliveries>): Delivery {
  return { ...row, status: row.status as Delivery["status"] };
}

function mapEvalCase(row: Row<typeof schema.evalCases>): EvalCase {
  return {
    ...row,
    category: row.category as EvalCase["category"],
    expectedDecision: row.expectedDecision as EvalCase["expectedDecision"],
    expectedRisk: row.expectedRisk as EvalCase["expectedRisk"],
  };
}

function mapEvalRun(row: Row<typeof schema.evalRuns>): EvalRun {
  return { ...row, status: row.status as EvalRun["status"] };
}

function mapEvalResult(row: Row<typeof schema.evalResults>): EvalResult {
  return {
    ...row,
    category: row.category as EvalResult["category"],
    decision: row.decision as EvalResult["decision"],
    risk: row.risk as EvalResult["risk"],
    passed: Boolean(row.passed),
  };
}

function mapAudit(row: Row<typeof schema.auditLogs>): AuditLog {
  return row;
}

const now = () => new Date().toISOString();

export class PostgresStore implements Store {
  readonly kind = "postgres" as const;
  private ready = false;

  async init(): Promise<void> {
    if (this.ready) return;
    const db = getDb();
    await db.execute(sql`select 1 from organizations limit 1`);
    this.ready = true;
  }

  async reset(): Promise<void> {
    const db = getDb();
    const tables = [
      schema.evalResults,
      schema.evalRuns,
      schema.evalCases,
      schema.deliveries,
      schema.journeyRuns,
      schema.journeyEnrollments,
      schema.journeys,
      schema.customerEvents,
      schema.auditLogs,
      schema.citations,
      schema.handoffs,
      schema.messages,
      schema.conversations,
      schema.knowledgeChunks,
      schema.knowledgeSources,
      schema.queues,
      schema.customers,
      schema.agents,
      schema.organizations,
    ];
    for (const table of tables) {
      await db.delete(table);
    }
    const seed = await createSeedData();
    await this.insertSeed(seed);
  }

  private async insertSeed(data: Awaited<ReturnType<typeof createSeedData>>) {
    const db = getDb();
    await db.insert(schema.organizations).values(data.organization);
    await db.insert(schema.agents).values(data.agents);
    await db.insert(schema.customers).values(
      data.customers.map((c) => ({ ...c, emailOptOut: c.emailOptOut ? 1 : 0 })),
    );
    await db.insert(schema.queues).values(data.queues);
    await db.insert(schema.knowledgeSources).values(data.knowledgeSources);
    await db.insert(schema.knowledgeChunks).values(data.knowledgeChunks);
    await db.insert(schema.conversations).values(data.conversations);
    await db.insert(schema.messages).values(
      data.messages.map((m) => ({
        ...m,
        estimatedCostUsd:
          m.estimatedCostUsd === null ? null : String(m.estimatedCostUsd),
      })),
    );
    if (data.citations.length) {
      await db.insert(schema.citations).values(
        data.citations.map((c) => ({ ...c, score: String(c.score) })),
      );
    }
    if (data.handoffs.length) {
      await db.insert(schema.handoffs).values(data.handoffs);
    }
    await db.insert(schema.customerEvents).values(data.customerEvents);
    await db.insert(schema.journeys).values(data.journeys);
    if (data.enrollments.length) {
      await db.insert(schema.journeyEnrollments).values(data.enrollments);
    }
    if (data.journeyRuns.length) {
      await db.insert(schema.journeyRuns).values(data.journeyRuns);
    }
    if (data.deliveries.length) {
      await db.insert(schema.deliveries).values(data.deliveries);
    }
    await db.insert(schema.evalCases).values(data.evalCases);
    if (data.auditLogs.length) {
      await db.insert(schema.auditLogs).values(data.auditLogs);
    }
  }

  async close(): Promise<void> {
    await closeDb();
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    const [row] = await getDb()
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, orgId))
      .limit(1);
    return row ? mapOrganization(row) : null;
  }

  async updateOrganization(
    orgId: string,
    patch: Partial<Organization>,
  ): Promise<Organization | null> {
    const {
      id: _id,
      createdAt: _created,
      updatedAt: _updated,
      ...rest
    } = patch;
    const [row] = await getDb()
      .update(schema.organizations)
      .set({ ...rest, updatedAt: now() })
      .where(eq(schema.organizations.id, orgId))
      .returning();
    return row ? mapOrganization(row) : null;
  }

  async listAgents(orgId: string): Promise<Agent[]> {
    const rows = await getDb()
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.organizationId, orgId))
      .orderBy(asc(schema.agents.name));
    return rows.map(mapAgent);
  }

  async getAgent(orgId: string, id: string): Promise<Agent | null> {
    const [row] = await getDb()
      .select()
      .from(schema.agents)
      .where(and(eq(schema.agents.organizationId, orgId), eq(schema.agents.id, id)))
      .limit(1);
    return row ? mapAgent(row) : null;
  }

  async listCustomers(orgId: string): Promise<Customer[]> {
    const rows = await getDb()
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.organizationId, orgId))
      .orderBy(asc(schema.customers.name));
    return rows.map(mapCustomer);
  }

  async getCustomer(orgId: string, id: string): Promise<Customer | null> {
    const [row] = await getDb()
      .select()
      .from(schema.customers)
      .where(
        and(
          eq(schema.customers.organizationId, orgId),
          eq(schema.customers.id, id),
        ),
      )
      .limit(1);
    return row ? mapCustomer(row) : null;
  }

  async createCustomer(
    orgId: string,
    customer: Customer,
  ): Promise<Customer> {
    if (customer.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.customers)
      .values({ ...customer, emailOptOut: customer.emailOptOut ? 1 : 0 })
      .returning();
    return mapCustomer(row!);
  }

  async updateCustomer(
    orgId: string,
    id: string,
    patch: Partial<Customer>,
  ): Promise<Customer | null> {
    const {
      id: _id,
      organizationId: _org,
      createdAt: _created,
      updatedAt: _updated,
      emailOptOut,
      ...rest
    } = patch;
    const set: Partial<typeof schema.customers.$inferInsert> = {
      ...rest,
      updatedAt: now(),
    };
    if (emailOptOut !== undefined) set.emailOptOut = emailOptOut ? 1 : 0;
    const [row] = await getDb()
      .update(schema.customers)
      .set(set)
      .where(
        and(
          eq(schema.customers.organizationId, orgId),
          eq(schema.customers.id, id),
        ),
      )
      .returning();
    return row ? mapCustomer(row) : null;
  }

  async listQueues(orgId: string): Promise<Queue[]> {
    const rows = await getDb()
      .select()
      .from(schema.queues)
      .where(eq(schema.queues.organizationId, orgId))
      .orderBy(asc(schema.queues.name));
    return rows.map(mapQueue);
  }

  async getQueue(orgId: string, id: string): Promise<Queue | null> {
    const [row] = await getDb()
      .select()
      .from(schema.queues)
      .where(and(eq(schema.queues.organizationId, orgId), eq(schema.queues.id, id)))
      .limit(1);
    return row ? mapQueue(row) : null;
  }

  async listSources(orgId: string): Promise<KnowledgeSource[]> {
    const rows = await getDb()
      .select()
      .from(schema.knowledgeSources)
      .where(eq(schema.knowledgeSources.organizationId, orgId))
      .orderBy(
        asc(schema.knowledgeSources.type),
        asc(schema.knowledgeSources.title),
      );
    return rows.map(mapSource);
  }

  async getSourceById(
    orgId: string,
    id: string,
  ): Promise<KnowledgeSource | null> {
    const [row] = await getDb()
      .select()
      .from(schema.knowledgeSources)
      .where(
        and(
          eq(schema.knowledgeSources.organizationId, orgId),
          eq(schema.knowledgeSources.id, id),
        ),
      )
      .limit(1);
    return row ? mapSource(row) : null;
  }

  async getSourceBySlug(
    orgId: string,
    slug: string,
  ): Promise<KnowledgeSource | null> {
    const [row] = await getDb()
      .select()
      .from(schema.knowledgeSources)
      .where(
        and(
          eq(schema.knowledgeSources.organizationId, orgId),
          eq(schema.knowledgeSources.slug, slug),
        ),
      )
      .limit(1);
    return row ? mapSource(row) : null;
  }

  async createSource(
    orgId: string,
    source: KnowledgeSource,
  ): Promise<KnowledgeSource> {
    if (source.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.knowledgeSources)
      .values(source)
      .returning();
    return mapSource(row!);
  }

  async updateSource(
    orgId: string,
    id: string,
    patch: Partial<KnowledgeSource>,
  ): Promise<KnowledgeSource | null> {
    const {
      id: _id,
      organizationId: _org,
      createdAt: _created,
      updatedAt: _updated,
      ...rest
    } = patch;
    const [row] = await getDb()
      .update(schema.knowledgeSources)
      .set({ ...rest, updatedAt: now() })
      .where(
        and(
          eq(schema.knowledgeSources.organizationId, orgId),
          eq(schema.knowledgeSources.id, id),
        ),
      )
      .returning();
    return row ? mapSource(row) : null;
  }

  async listChunks(
    orgId: string,
    sourceId?: string,
  ): Promise<KnowledgeChunk[]> {
    const rows = await getDb()
      .select()
      .from(schema.knowledgeChunks)
      .where(
        sourceId
          ? and(
              eq(schema.knowledgeChunks.organizationId, orgId),
              eq(schema.knowledgeChunks.sourceId, sourceId),
            )
          : eq(schema.knowledgeChunks.organizationId, orgId),
      )
      .orderBy(asc(schema.knowledgeChunks.chunkIndex));
    return rows.map(mapChunk);
  }

  async searchChunks(
    orgId: string,
    query: string,
    limit: number,
  ): Promise<{ chunkId: string; rank: number }[]> {
    if (!query.trim()) return [];
    const result = await getDb().execute(sql`
      select
        c.id as chunk_id,
        ts_rank_cd(
          to_tsvector('english', c.heading || ' ' || c.content),
          websearch_to_tsquery('english', ${query})
        ) as rank
      from knowledge_chunks c
      join knowledge_sources s on s.id = c.source_id
      where c.organization_id = ${orgId}
        and s.status = 'active'
        and to_tsvector('english', c.heading || ' ' || c.content)
          @@ websearch_to_tsquery('english', ${query})
      order by rank desc
      limit ${limit}
    `);
    return (result as unknown as { chunk_id: string; rank: number }[]).map(
      (row) => ({ chunkId: row.chunk_id, rank: Number(row.rank) }),
    );
  }

  async replaceChunks(
    orgId: string,
    sourceId: string,
    chunks: KnowledgeChunk[],
  ): Promise<void> {
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx
        .delete(schema.knowledgeChunks)
        .where(
          and(
            eq(schema.knowledgeChunks.organizationId, orgId),
            eq(schema.knowledgeChunks.sourceId, sourceId),
          ),
        );
      if (chunks.length) {
        await tx.insert(schema.knowledgeChunks).values(chunks);
      }
    });
  }

  async listConversations(orgId: string): Promise<Conversation[]> {
    const rows = await getDb()
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.organizationId, orgId))
      .orderBy(desc(schema.conversations.lastMessageAt));
    return rows.map(mapConversation);
  }

  async getConversation(
    orgId: string,
    id: string,
  ): Promise<Conversation | null> {
    const [row] = await getDb()
      .select()
      .from(schema.conversations)
      .where(
        and(
          eq(schema.conversations.organizationId, orgId),
          eq(schema.conversations.id, id),
        ),
      )
      .limit(1);
    return row ? mapConversation(row) : null;
  }

  async createConversation(
    orgId: string,
    conversation: Conversation,
  ): Promise<Conversation> {
    if (conversation.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.conversations)
      .values(conversation)
      .returning();
    return mapConversation(row!);
  }

  async updateConversation(
    orgId: string,
    id: string,
    patch: Partial<Conversation>,
  ): Promise<Conversation | null> {
    const {
      id: _id,
      organizationId: _org,
      createdAt: _created,
      updatedAt: _updated,
      ...rest
    } = patch;
    const [row] = await getDb()
      .update(schema.conversations)
      .set({ ...rest, updatedAt: now() })
      .where(
        and(
          eq(schema.conversations.organizationId, orgId),
          eq(schema.conversations.id, id),
        ),
      )
      .returning();
    return row ? mapConversation(row) : null;
  }

  async listMessages(
    orgId: string,
    conversationId: string,
  ): Promise<Message[]> {
    const rows = await getDb()
      .select()
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.organizationId, orgId),
          eq(schema.messages.conversationId, conversationId),
        ),
      )
      .orderBy(asc(schema.messages.createdAt));
    return rows.map(mapMessage);
  }

  async createMessage(orgId: string, message: Message): Promise<Message> {
    if (message.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.messages)
      .values({
        ...message,
        estimatedCostUsd:
          message.estimatedCostUsd === null
            ? null
            : String(message.estimatedCostUsd),
      })
      .returning();
    return mapMessage(row!);
  }

  async listCitations(
    orgId: string,
    conversationId: string,
  ): Promise<Citation[]> {
    const rows = await getDb()
      .select()
      .from(schema.citations)
      .where(
        and(
          eq(schema.citations.organizationId, orgId),
          eq(schema.citations.conversationId, conversationId),
        ),
      )
      .orderBy(asc(schema.citations.createdAt));
    return rows.map(mapCitation);
  }

  async createCitations(
    orgId: string,
    citations: Citation[],
  ): Promise<Citation[]> {
    if (!citations.length) return [];
    for (const c of citations) {
      if (c.organizationId !== orgId) {
        throw new Error("Tenant isolation violation: organization mismatch.");
      }
    }
    const rows = await getDb()
      .insert(schema.citations)
      .values(citations.map((c) => ({ ...c, score: String(c.score) })))
      .returning();
    return rows.map(mapCitation);
  }

  async createHandoff(orgId: string, handoff: Handoff): Promise<Handoff> {
    if (handoff.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.handoffs)
      .values(handoff)
      .returning();
    return mapHandoff(row!);
  }

  async getHandoff(orgId: string, id: string): Promise<Handoff | null> {
    const [row] = await getDb()
      .select()
      .from(schema.handoffs)
      .where(
        and(
          eq(schema.handoffs.organizationId, orgId),
          eq(schema.handoffs.id, id),
        ),
      )
      .limit(1);
    return row ? mapHandoff(row) : null;
  }

  async getHandoffByConversation(
    orgId: string,
    conversationId: string,
  ): Promise<Handoff | null> {
    const [row] = await getDb()
      .select()
      .from(schema.handoffs)
      .where(
        and(
          eq(schema.handoffs.organizationId, orgId),
          eq(schema.handoffs.conversationId, conversationId),
        ),
      )
      .orderBy(desc(schema.handoffs.createdAt))
      .limit(1);
    return row ? mapHandoff(row) : null;
  }

  async listHandoffs(orgId: string): Promise<Handoff[]> {
    const rows = await getDb()
      .select()
      .from(schema.handoffs)
      .where(eq(schema.handoffs.organizationId, orgId))
      .orderBy(desc(schema.handoffs.createdAt));
    return rows.map(mapHandoff);
  }

  async updateHandoff(
    orgId: string,
    id: string,
    patch: Partial<Handoff>,
  ): Promise<Handoff | null> {
    const {
      id: _id,
      organizationId: _org,
      createdAt: _created,
      updatedAt: _updated,
      ...rest
    } = patch;
    const [row] = await getDb()
      .update(schema.handoffs)
      .set({ ...rest, updatedAt: now() })
      .where(
        and(eq(schema.handoffs.organizationId, orgId), eq(schema.handoffs.id, id)),
      )
      .returning();
    return row ? mapHandoff(row) : null;
  }

  async listCustomerEvents(orgId: string): Promise<CustomerEvent[]> {
    const rows = await getDb()
      .select()
      .from(schema.customerEvents)
      .where(eq(schema.customerEvents.organizationId, orgId))
      .orderBy(desc(schema.customerEvents.occurredAt));
    return rows.map(mapCustomerEvent);
  }

  async createCustomerEvent(
    orgId: string,
    event: CustomerEvent,
  ): Promise<CustomerEvent> {
    if (event.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.customerEvents)
      .values(event)
      .returning();
    return mapCustomerEvent(row!);
  }

  async listJourneys(orgId: string): Promise<Journey[]> {
    const rows = await getDb()
      .select()
      .from(schema.journeys)
      .where(eq(schema.journeys.organizationId, orgId))
      .orderBy(asc(schema.journeys.name));
    return rows.map(mapJourney);
  }

  async getJourney(orgId: string, id: string): Promise<Journey | null> {
    const [row] = await getDb()
      .select()
      .from(schema.journeys)
      .where(
        and(eq(schema.journeys.organizationId, orgId), eq(schema.journeys.id, id)),
      )
      .limit(1);
    return row ? mapJourney(row) : null;
  }

  async updateJourney(
    orgId: string,
    id: string,
    patch: Partial<Journey>,
  ): Promise<Journey | null> {
    const {
      id: _id,
      organizationId: _org,
      createdAt: _created,
      updatedAt: _updated,
      ...rest
    } = patch;
    const [row] = await getDb()
      .update(schema.journeys)
      .set({ ...rest, updatedAt: now() })
      .where(
        and(eq(schema.journeys.organizationId, orgId), eq(schema.journeys.id, id)),
      )
      .returning();
    return row ? mapJourney(row) : null;
  }

  async listEnrollments(orgId: string): Promise<JourneyEnrollment[]> {
    const rows = await getDb()
      .select()
      .from(schema.journeyEnrollments)
      .where(eq(schema.journeyEnrollments.organizationId, orgId))
      .orderBy(desc(schema.journeyEnrollments.enteredAt));
    return rows.map(mapEnrollment);
  }

  async createEnrollment(
    orgId: string,
    enrollment: JourneyEnrollment,
  ): Promise<JourneyEnrollment> {
    if (enrollment.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.journeyEnrollments)
      .values(enrollment)
      .returning();
    return mapEnrollment(row!);
  }

  async updateEnrollment(
    orgId: string,
    id: string,
    patch: Partial<JourneyEnrollment>,
  ): Promise<JourneyEnrollment | null> {
    const {
      id: _id,
      organizationId: _org,
      enteredAt: _entered,
      updatedAt: _updated,
      ...rest
    } = patch;
    const [row] = await getDb()
      .update(schema.journeyEnrollments)
      .set({ ...rest, updatedAt: now() })
      .where(
        and(
          eq(schema.journeyEnrollments.organizationId, orgId),
          eq(schema.journeyEnrollments.id, id),
        ),
      )
      .returning();
    return row ? mapEnrollment(row) : null;
  }

  async findEnrollmentByDedupe(
    orgId: string,
    journeyId: string,
    dedupeKey: string,
  ): Promise<JourneyEnrollment | null> {
    const [row] = await getDb()
      .select()
      .from(schema.journeyEnrollments)
      .where(
        and(
          eq(schema.journeyEnrollments.organizationId, orgId),
          eq(schema.journeyEnrollments.journeyId, journeyId),
          eq(schema.journeyEnrollments.dedupeKey, dedupeKey),
          ne(schema.journeyEnrollments.status, "cancelled"),
        ),
      )
      .limit(1);
    return row ? mapEnrollment(row) : null;
  }

  async listJourneyRuns(orgId: string): Promise<JourneyRun[]> {
    const rows = await getDb()
      .select()
      .from(schema.journeyRuns)
      .where(eq(schema.journeyRuns.organizationId, orgId))
      .orderBy(desc(schema.journeyRuns.createdAt));
    return rows.map(mapJourneyRun);
  }

  async createJourneyRun(orgId: string, run: JourneyRun): Promise<JourneyRun> {
    if (run.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.journeyRuns)
      .values(run)
      .returning();
    return mapJourneyRun(row!);
  }

  async listDeliveries(orgId: string): Promise<Delivery[]> {
    const rows = await getDb()
      .select()
      .from(schema.deliveries)
      .where(eq(schema.deliveries.organizationId, orgId))
      .orderBy(desc(schema.deliveries.createdAt));
    return rows.map(mapDelivery);
  }

  async createDelivery(orgId: string, delivery: Delivery): Promise<Delivery> {
    if (delivery.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.deliveries)
      .values(delivery)
      .returning();
    return mapDelivery(row!);
  }

  async updateDelivery(
    orgId: string,
    id: string,
    patch: Partial<Delivery>,
  ): Promise<Delivery | null> {
    const {
      id: _id,
      organizationId: _org,
      createdAt: _created,
      updatedAt: _updated,
      ...rest
    } = patch;
    const [row] = await getDb()
      .update(schema.deliveries)
      .set({ ...rest, updatedAt: now() })
      .where(
        and(
          eq(schema.deliveries.organizationId, orgId),
          eq(schema.deliveries.id, id),
        ),
      )
      .returning();
    return row ? mapDelivery(row) : null;
  }

  async listEvalCases(orgId: string): Promise<EvalCase[]> {
    const rows = await getDb()
      .select()
      .from(schema.evalCases)
      .where(eq(schema.evalCases.organizationId, orgId))
      .orderBy(asc(schema.evalCases.caseKey));
    return rows.map(mapEvalCase);
  }

  async listEvalRuns(orgId: string): Promise<EvalRun[]> {
    const rows = await getDb()
      .select()
      .from(schema.evalRuns)
      .where(eq(schema.evalRuns.organizationId, orgId))
      .orderBy(desc(schema.evalRuns.createdAt));
    return rows.map(mapEvalRun);
  }

  async getEvalRun(orgId: string, id: string): Promise<EvalRun | null> {
    const [row] = await getDb()
      .select()
      .from(schema.evalRuns)
      .where(
        and(eq(schema.evalRuns.organizationId, orgId), eq(schema.evalRuns.id, id)),
      )
      .limit(1);
    return row ? mapEvalRun(row) : null;
  }

  async createEvalRun(orgId: string, run: EvalRun): Promise<EvalRun> {
    if (run.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb().insert(schema.evalRuns).values(run).returning();
    return mapEvalRun(row!);
  }

  async updateEvalRun(
    orgId: string,
    id: string,
    patch: Partial<EvalRun>,
  ): Promise<EvalRun | null> {
    const {
      id: _id,
      organizationId: _org,
      createdAt: _created,
      ...rest
    } = patch;
    const [row] = await getDb()
      .update(schema.evalRuns)
      .set(rest)
      .where(
        and(eq(schema.evalRuns.organizationId, orgId), eq(schema.evalRuns.id, id)),
      )
      .returning();
    return row ? mapEvalRun(row) : null;
  }

  async listEvalResults(
    orgId: string,
    runId: string,
  ): Promise<EvalResult[]> {
    const rows = await getDb()
      .select()
      .from(schema.evalResults)
      .where(
        and(
          eq(schema.evalResults.organizationId, orgId),
          eq(schema.evalResults.runId, runId),
        ),
      )
      .orderBy(asc(schema.evalResults.caseKey));
    return rows.map(mapEvalResult);
  }

  async createEvalResult(
    orgId: string,
    result: EvalResult,
  ): Promise<EvalResult> {
    if (result.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.evalResults)
      .values({ ...result, passed: result.passed ? 1 : 0 })
      .returning();
    return mapEvalResult(row!);
  }

  async createAuditLog(orgId: string, log: AuditLog): Promise<AuditLog> {
    if (log.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
    const [row] = await getDb()
      .insert(schema.auditLogs)
      .values(log)
      .returning();
    return mapAudit(row!);
  }

  async listAuditLogs(orgId: string, limit = 100): Promise<AuditLog[]> {
    const rows = await getDb()
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.organizationId, orgId))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit);
    return rows.map(mapAudit);
  }
}
