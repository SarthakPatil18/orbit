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

export interface Store {
  readonly kind: "file" | "postgres";
  init(): Promise<void>;
  reset(): Promise<void>;
  close(): Promise<void>;

  getOrganization(orgId: string): Promise<Organization | null>;
  updateOrganization(
    orgId: string,
    patch: Partial<Organization>,
  ): Promise<Organization | null>;

  listAgents(orgId: string): Promise<Agent[]>;
  getAgent(orgId: string, id: string): Promise<Agent | null>;

  listCustomers(orgId: string): Promise<Customer[]>;
  getCustomer(orgId: string, id: string): Promise<Customer | null>;
  createCustomer(orgId: string, customer: Customer): Promise<Customer>;
  updateCustomer(
    orgId: string,
    id: string,
    patch: Partial<Customer>,
  ): Promise<Customer | null>;

  listQueues(orgId: string): Promise<Queue[]>;
  getQueue(orgId: string, id: string): Promise<Queue | null>;

  listSources(orgId: string): Promise<KnowledgeSource[]>;
  getSourceById(orgId: string, id: string): Promise<KnowledgeSource | null>;
  getSourceBySlug(orgId: string, slug: string): Promise<KnowledgeSource | null>;
  createSource(orgId: string, source: KnowledgeSource): Promise<KnowledgeSource>;
  updateSource(
    orgId: string,
    id: string,
    patch: Partial<KnowledgeSource>,
  ): Promise<KnowledgeSource | null>;
  listChunks(orgId: string, sourceId?: string): Promise<KnowledgeChunk[]>;
  searchChunks(
    orgId: string,
    query: string,
    limit: number,
  ): Promise<{ chunkId: string; rank: number }[]>;
  replaceChunks(
    orgId: string,
    sourceId: string,
    chunks: KnowledgeChunk[],
  ): Promise<void>;

  listConversations(orgId: string): Promise<Conversation[]>;
  getConversation(orgId: string, id: string): Promise<Conversation | null>;
  createConversation(
    orgId: string,
    conversation: Conversation,
  ): Promise<Conversation>;
  updateConversation(
    orgId: string,
    id: string,
    patch: Partial<Conversation>,
  ): Promise<Conversation | null>;

  listMessages(orgId: string, conversationId: string): Promise<Message[]>;
  createMessage(orgId: string, message: Message): Promise<Message>;

  listCitations(orgId: string, conversationId: string): Promise<Citation[]>;
  createCitations(orgId: string, citations: Citation[]): Promise<Citation[]>;

  createHandoff(orgId: string, handoff: Handoff): Promise<Handoff>;
  getHandoff(orgId: string, id: string): Promise<Handoff | null>;
  getHandoffByConversation(
    orgId: string,
    conversationId: string,
  ): Promise<Handoff | null>;
  listHandoffs(orgId: string): Promise<Handoff[]>;
  updateHandoff(
    orgId: string,
    id: string,
    patch: Partial<Handoff>,
  ): Promise<Handoff | null>;

  listCustomerEvents(orgId: string): Promise<CustomerEvent[]>;
  createCustomerEvent(
    orgId: string,
    event: CustomerEvent,
  ): Promise<CustomerEvent>;

  listJourneys(orgId: string): Promise<Journey[]>;
  getJourney(orgId: string, id: string): Promise<Journey | null>;
  updateJourney(
    orgId: string,
    id: string,
    patch: Partial<Journey>,
  ): Promise<Journey | null>;

  listEnrollments(orgId: string): Promise<JourneyEnrollment[]>;
  createEnrollment(
    orgId: string,
    enrollment: JourneyEnrollment,
  ): Promise<JourneyEnrollment>;
  updateEnrollment(
    orgId: string,
    id: string,
    patch: Partial<JourneyEnrollment>,
  ): Promise<JourneyEnrollment | null>;
  findEnrollmentByDedupe(
    orgId: string,
    journeyId: string,
    dedupeKey: string,
  ): Promise<JourneyEnrollment | null>;

  listJourneyRuns(orgId: string): Promise<JourneyRun[]>;
  createJourneyRun(orgId: string, run: JourneyRun): Promise<JourneyRun>;

  listDeliveries(orgId: string): Promise<Delivery[]>;
  createDelivery(orgId: string, delivery: Delivery): Promise<Delivery>;
  updateDelivery(
    orgId: string,
    id: string,
    patch: Partial<Delivery>,
  ): Promise<Delivery | null>;

  listEvalCases(orgId: string): Promise<EvalCase[]>;
  listEvalRuns(orgId: string): Promise<EvalRun[]>;
  getEvalRun(orgId: string, id: string): Promise<EvalRun | null>;
  createEvalRun(orgId: string, run: EvalRun): Promise<EvalRun>;
  updateEvalRun(
    orgId: string,
    id: string,
    patch: Partial<EvalRun>,
  ): Promise<EvalRun | null>;
  listEvalResults(orgId: string, runId: string): Promise<EvalResult[]>;
  createEvalResult(orgId: string, result: EvalResult): Promise<EvalResult>;

  createAuditLog(orgId: string, log: AuditLog): Promise<AuditLog>;
  listAuditLogs(orgId: string, limit?: number): Promise<AuditLog[]>;
}

export type StoreKind = Store["kind"];
