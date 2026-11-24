import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSeedData, SEED_VERSION, type SeedData } from "@/lib/seed";
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
import type { Store } from "./types";

interface FileShape extends SeedData {
  version: string;
  seededAt: string;
  evalRuns: EvalRun[];
  evalResults: EvalResult[];
}

const clone = <T>(value: T): T => structuredClone(value);

export interface FileStoreOptions {
  dataDir: string;
  seedFactory?: () => Promise<SeedData>;
  seedVersion?: string;
}

/**
 * Durable single-instance adapter for demo mode. It is deliberately a real
 * persistence layer (atomic JSON writes), not browser localStorage. The
 * PostgreSQL adapter implements the same Store contract for deployments.
 */
export class FileStore implements Store {
  readonly kind = "file" as const;
  private readonly filePath: string;
  private readonly seedFactory: () => Promise<SeedData>;
  private readonly seedVersion: string;
  private data: FileShape | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(options: FileStoreOptions) {
    this.filePath = path.join(options.dataDir, "proofdesk.json");
    this.seedFactory = options.seedFactory ?? createSeedData;
    this.seedVersion = options.seedVersion ?? SEED_VERSION;
  }

  async init(): Promise<void> {
    if (this.data) return;
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as FileShape;
      if (parsed.version !== this.seedVersion) {
        await this.backup(`version-${parsed.version}`);
        await this.seed();
        return;
      }
      this.data = {
        ...parsed,
        evalRuns: parsed.evalRuns ?? [],
        evalResults: parsed.evalResults ?? [],
      };
    } catch {
      await this.seed();
    }
  }

  async reset(): Promise<void> {
    if (this.data) {
      await this.backup(`reset-${Date.now()}`);
    }
    await this.seed();
  }

  async close(): Promise<void> {
    await this.writeQueue;
  }

  private async backup(reason: string): Promise<void> {
    try {
      await rename(this.filePath, `${this.filePath}.${reason}.bak`);
    } catch {
      // Nothing to back up.
    }
  }

  private async seed(): Promise<void> {
    const seeded = await this.seedFactory();
    this.data = {
      ...seeded,
      version: this.seedVersion,
      seededAt: new Date().toISOString(),
      evalRuns: [],
      evalResults: [],
    };
    await this.persist();
  }

  private async persist(): Promise<void> {
    const snapshot = JSON.stringify(this.data, null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(tmp, snapshot, "utf8");
      await rename(tmp, this.filePath);
    });
    await this.writeQueue;
  }

  private db(): FileShape {
    if (!this.data) {
      throw new Error("FileStore.init() must be called before use.");
    }
    return this.data;
  }

  private guardOrg(orgId: string, entity: { organizationId: string }): void {
    if (entity.organizationId !== orgId) {
      throw new Error("Tenant isolation violation: organization mismatch.");
    }
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    const row = this.db().organization;
    return row.id === orgId ? clone(row) : null;
  }

  async updateOrganization(
    orgId: string,
    patch: Partial<Organization>,
  ): Promise<Organization | null> {
    const db = this.db();
    if (db.organization.id !== orgId) return null;
    db.organization = {
      ...db.organization,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await this.persist();
    return clone(db.organization);
  }

  async listAgents(orgId: string): Promise<Agent[]> {
    return clone(this.db().agents.filter((a) => a.organizationId === orgId));
  }

  async getAgent(orgId: string, id: string): Promise<Agent | null> {
    const row = this.db().agents.find(
      (a) => a.organizationId === orgId && a.id === id,
    );
    return row ? clone(row) : null;
  }

  async listCustomers(orgId: string): Promise<Customer[]> {
    return clone(this.db().customers.filter((c) => c.organizationId === orgId));
  }

  async getCustomer(orgId: string, id: string): Promise<Customer | null> {
    const row = this.db().customers.find(
      (c) => c.organizationId === orgId && c.id === id,
    );
    return row ? clone(row) : null;
  }

  async createCustomer(
    orgId: string,
    customer: Customer,
  ): Promise<Customer> {
    this.guardOrg(orgId, customer);
    this.db().customers.push(clone(customer));
    await this.persist();
    return clone(customer);
  }

  async updateCustomer(
    orgId: string,
    id: string,
    patch: Partial<Customer>,
  ): Promise<Customer | null> {
    const db = this.db();
    const index = db.customers.findIndex(
      (c) => c.organizationId === orgId && c.id === id,
    );
    const current = db.customers[index];
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.guardOrg(orgId, next);
    db.customers[index] = next;
    await this.persist();
    return clone(next);
  }

  async listQueues(orgId: string): Promise<Queue[]> {
    return clone(this.db().queues.filter((q) => q.organizationId === orgId));
  }

  async getQueue(orgId: string, id: string): Promise<Queue | null> {
    const row = this.db().queues.find(
      (q) => q.organizationId === orgId && q.id === id,
    );
    return row ? clone(row) : null;
  }

  async listSources(orgId: string): Promise<KnowledgeSource[]> {
    return clone(
      this.db()
        .knowledgeSources.filter((s) => s.organizationId === orgId)
        .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title)),
    );
  }

  async getSourceById(
    orgId: string,
    id: string,
  ): Promise<KnowledgeSource | null> {
    const row = this.db().knowledgeSources.find(
      (s) => s.organizationId === orgId && s.id === id,
    );
    return row ? clone(row) : null;
  }

  async getSourceBySlug(
    orgId: string,
    slug: string,
  ): Promise<KnowledgeSource | null> {
    const row = this.db().knowledgeSources.find(
      (s) => s.organizationId === orgId && s.slug === slug,
    );
    return row ? clone(row) : null;
  }

  async createSource(
    orgId: string,
    source: KnowledgeSource,
  ): Promise<KnowledgeSource> {
    this.guardOrg(orgId, source);
    if (
      this.db().knowledgeSources.some(
        (s) => s.organizationId === orgId && s.slug === source.slug,
      )
    ) {
      throw new Error("A source with this slug already exists.");
    }
    this.db().knowledgeSources.push(clone(source));
    await this.persist();
    return clone(source);
  }

  async updateSource(
    orgId: string,
    id: string,
    patch: Partial<KnowledgeSource>,
  ): Promise<KnowledgeSource | null> {
    const db = this.db();
    const index = db.knowledgeSources.findIndex(
      (s) => s.organizationId === orgId && s.id === id,
    );
    const current = db.knowledgeSources[index];
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.guardOrg(orgId, next);
    db.knowledgeSources[index] = next;
    await this.persist();
    return clone(next);
  }

  async listChunks(
    orgId: string,
    sourceId?: string,
  ): Promise<KnowledgeChunk[]> {
    return clone(
      this.db().knowledgeChunks.filter(
        (c) =>
          c.organizationId === orgId && (!sourceId || c.sourceId === sourceId),
      ),
    );
  }

  async searchChunks(
    _orgId: string,
    _query: string,
    _limit: number,
  ): Promise<{ chunkId: string; rank: number }[]> {
    // The file adapter has no PostgreSQL FTS. RetrievalService performs a
    // deterministic lexical pass and labels the mode accordingly.
    return [];
  }

  async replaceChunks(
    orgId: string,
    sourceId: string,
    chunks: KnowledgeChunk[],
  ): Promise<void> {
    for (const chunk of chunks) {
      this.guardOrg(orgId, chunk);
      if (chunk.sourceId !== sourceId) {
        throw new Error("Chunk does not belong to the requested source.");
      }
    }
    const db = this.db();
    db.knowledgeChunks = db.knowledgeChunks.filter(
      (c) => !(c.organizationId === orgId && c.sourceId === sourceId),
    );
    db.knowledgeChunks.push(...clone(chunks));
    await this.persist();
  }

  async listConversations(orgId: string): Promise<Conversation[]> {
    return clone(
      this.db()
        .conversations.filter((c) => c.organizationId === orgId)
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
    );
  }

  async getConversation(
    orgId: string,
    id: string,
  ): Promise<Conversation | null> {
    const row = this.db().conversations.find(
      (c) => c.organizationId === orgId && c.id === id,
    );
    return row ? clone(row) : null;
  }

  async createConversation(
    orgId: string,
    conversation: Conversation,
  ): Promise<Conversation> {
    this.guardOrg(orgId, conversation);
    this.db().conversations.push(clone(conversation));
    await this.persist();
    return clone(conversation);
  }

  async updateConversation(
    orgId: string,
    id: string,
    patch: Partial<Conversation>,
  ): Promise<Conversation | null> {
    const db = this.db();
    const index = db.conversations.findIndex(
      (c) => c.organizationId === orgId && c.id === id,
    );
    const current = db.conversations[index];
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.guardOrg(orgId, next);
    db.conversations[index] = next;
    await this.persist();
    return clone(next);
  }

  async listMessages(orgId: string, conversationId: string): Promise<Message[]> {
    return clone(
      this.db()
        .messages.filter(
          (m) =>
            m.organizationId === orgId && m.conversationId === conversationId,
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    );
  }

  async createMessage(orgId: string, message: Message): Promise<Message> {
    this.guardOrg(orgId, message);
    this.db().messages.push(clone(message));
    await this.persist();
    return clone(message);
  }

  async listCitations(orgId: string, conversationId: string): Promise<Citation[]> {
    return clone(
      this.db().citations.filter(
        (c) =>
          c.organizationId === orgId && c.conversationId === conversationId,
      ),
    );
  }

  async createCitations(
    orgId: string,
    citations: Citation[],
  ): Promise<Citation[]> {
    for (const citation of citations) this.guardOrg(orgId, citation);
    this.db().citations.push(...clone(citations));
    await this.persist();
    return clone(citations);
  }

  async createHandoff(orgId: string, handoff: Handoff): Promise<Handoff> {
    this.guardOrg(orgId, handoff);
    this.db().handoffs.push(clone(handoff));
    await this.persist();
    return clone(handoff);
  }

  async getHandoff(orgId: string, id: string): Promise<Handoff | null> {
    const row = this.db().handoffs.find(
      (h) => h.organizationId === orgId && h.id === id,
    );
    return row ? clone(row) : null;
  }

  async getHandoffByConversation(
    orgId: string,
    conversationId: string,
  ): Promise<Handoff | null> {
    const row = this.db()
      .handoffs.filter(
        (h) =>
          h.organizationId === orgId && h.conversationId === conversationId,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return row ? clone(row) : null;
  }

  async listHandoffs(orgId: string): Promise<Handoff[]> {
    return clone(this.db().handoffs.filter((h) => h.organizationId === orgId));
  }

  async updateHandoff(
    orgId: string,
    id: string,
    patch: Partial<Handoff>,
  ): Promise<Handoff | null> {
    const db = this.db();
    const index = db.handoffs.findIndex(
      (h) => h.organizationId === orgId && h.id === id,
    );
    const current = db.handoffs[index];
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.guardOrg(orgId, next);
    db.handoffs[index] = next;
    await this.persist();
    return clone(next);
  }

  async listCustomerEvents(orgId: string): Promise<CustomerEvent[]> {
    return clone(
      this.db().customerEvents.filter((e) => e.organizationId === orgId),
    );
  }

  async createCustomerEvent(
    orgId: string,
    event: CustomerEvent,
  ): Promise<CustomerEvent> {
    this.guardOrg(orgId, event);
    this.db().customerEvents.push(clone(event));
    await this.persist();
    return clone(event);
  }

  async listJourneys(orgId: string): Promise<Journey[]> {
    return clone(this.db().journeys.filter((j) => j.organizationId === orgId));
  }

  async getJourney(orgId: string, id: string): Promise<Journey | null> {
    const row = this.db().journeys.find(
      (j) => j.organizationId === orgId && j.id === id,
    );
    return row ? clone(row) : null;
  }

  async updateJourney(
    orgId: string,
    id: string,
    patch: Partial<Journey>,
  ): Promise<Journey | null> {
    const db = this.db();
    const index = db.journeys.findIndex(
      (j) => j.organizationId === orgId && j.id === id,
    );
    const current = db.journeys[index];
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.guardOrg(orgId, next);
    db.journeys[index] = next;
    await this.persist();
    return clone(next);
  }

  async listEnrollments(orgId: string): Promise<JourneyEnrollment[]> {
    return clone(
      this.db()
        .enrollments.filter((e) => e.organizationId === orgId)
        .sort((a, b) => b.enteredAt.localeCompare(a.enteredAt)),
    );
  }

  async createEnrollment(
    orgId: string,
    enrollment: JourneyEnrollment,
  ): Promise<JourneyEnrollment> {
    this.guardOrg(orgId, enrollment);
    this.db().enrollments.push(clone(enrollment));
    await this.persist();
    return clone(enrollment);
  }

  async updateEnrollment(
    orgId: string,
    id: string,
    patch: Partial<JourneyEnrollment>,
  ): Promise<JourneyEnrollment | null> {
    const db = this.db();
    const index = db.enrollments.findIndex(
      (e) => e.organizationId === orgId && e.id === id,
    );
    const current = db.enrollments[index];
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.guardOrg(orgId, next);
    db.enrollments[index] = next;
    await this.persist();
    return clone(next);
  }

  async findEnrollmentByDedupe(
    orgId: string,
    journeyId: string,
    dedupeKey: string,
  ): Promise<JourneyEnrollment | null> {
    const row = this.db().enrollments.find(
      (e) =>
        e.organizationId === orgId &&
        e.journeyId === journeyId &&
        e.dedupeKey === dedupeKey &&
        e.status !== "cancelled",
    );
    return row ? clone(row) : null;
  }

  async listJourneyRuns(orgId: string): Promise<JourneyRun[]> {
    return clone(
      this.db()
        .journeyRuns.filter((r) => r.organizationId === orgId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  async createJourneyRun(orgId: string, run: JourneyRun): Promise<JourneyRun> {
    this.guardOrg(orgId, run);
    this.db().journeyRuns.push(clone(run));
    await this.persist();
    return clone(run);
  }

  async listDeliveries(orgId: string): Promise<Delivery[]> {
    return clone(
      this.db()
        .deliveries.filter((d) => d.organizationId === orgId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  async createDelivery(orgId: string, delivery: Delivery): Promise<Delivery> {
    this.guardOrg(orgId, delivery);
    this.db().deliveries.push(clone(delivery));
    await this.persist();
    return clone(delivery);
  }

  async updateDelivery(
    orgId: string,
    id: string,
    patch: Partial<Delivery>,
  ): Promise<Delivery | null> {
    const db = this.db();
    const index = db.deliveries.findIndex(
      (d) => d.organizationId === orgId && d.id === id,
    );
    const current = db.deliveries[index];
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.guardOrg(orgId, next);
    db.deliveries[index] = next;
    await this.persist();
    return clone(next);
  }

  async listEvalCases(orgId: string): Promise<EvalCase[]> {
    return clone(this.db().evalCases.filter((c) => c.organizationId === orgId));
  }

  async listEvalRuns(orgId: string): Promise<EvalRun[]> {
    return clone(
      this.db()
        .evalRuns.filter((r) => r.organizationId === orgId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  async getEvalRun(orgId: string, id: string): Promise<EvalRun | null> {
    const row = this.db().evalRuns.find(
      (r) => r.organizationId === orgId && r.id === id,
    );
    return row ? clone(row) : null;
  }

  async createEvalRun(orgId: string, run: EvalRun): Promise<EvalRun> {
    this.guardOrg(orgId, run);
    this.db().evalRuns.push(clone(run));
    await this.persist();
    return clone(run);
  }

  async updateEvalRun(
    orgId: string,
    id: string,
    patch: Partial<EvalRun>,
  ): Promise<EvalRun | null> {
    const db = this.db();
    const index = db.evalRuns.findIndex(
      (r) => r.organizationId === orgId && r.id === id,
    );
    const current = db.evalRuns[index];
    if (!current) return null;
    const next = { ...current, ...patch };
    this.guardOrg(orgId, next);
    db.evalRuns[index] = next;
    await this.persist();
    return clone(next);
  }

  async listEvalResults(orgId: string, runId: string): Promise<EvalResult[]> {
    return clone(
      this.db().evalResults.filter(
        (r) => r.organizationId === orgId && r.runId === runId,
      ),
    );
  }

  async createEvalResult(
    orgId: string,
    result: EvalResult,
  ): Promise<EvalResult> {
    this.guardOrg(orgId, result);
    this.db().evalResults.push(clone(result));
    await this.persist();
    return clone(result);
  }

  async createAuditLog(orgId: string, log: AuditLog): Promise<AuditLog> {
    this.guardOrg(orgId, log);
    this.db().auditLogs.push(clone(log));
    await this.persist();
    return clone(log);
  }

  async listAuditLogs(orgId: string, limit = 100): Promise<AuditLog[]> {
    return clone(
      this.db()
        .auditLogs.filter((l) => l.organizationId === orgId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit),
    );
  }
}
