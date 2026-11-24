export type Decision = "answer" | "clarify" | "abstain" | "escalate";
export type Risk = "low" | "medium" | "high";
export type Sentiment = "calm" | "confused" | "frustrated" | "distressed";
export type ConversationStatus =
  | "ai_active"
  | "needs_human"
  | "human_owned"
  | "resolved";

export type SourceType = "product" | "policy" | "legal" | "engineering";
export type SourceStatus = "active" | "draft" | "stale" | "archived";
export type Authority = "canonical" | "approved" | "reference";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro";
  billingStatus: "active" | "cancelled" | "past_due";
  periodEnd: string | null;
  ownerEmail: string;
  supportHours: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "agent";
  initials: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  club: string;
  role: "owner" | "manager" | "volunteer";
  plan: "free" | "pro";
  billingStatus: "active" | "cancelled" | "past_due";
  periodEnd: string | null;
  workspaceCreatedAt: string;
  lastActiveAt: string;
  draftEventName: string | null;
  draftUpdatedAt: string | null;
  upcomingEventName: string | null;
  upcomingEventDate: string | null;
  emailOptOut: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Queue {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  slaMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  customerId: string;
  queueId: string | null;
  subject: string;
  status: ConversationStatus;
  risk: Risk;
  sentiment: Sentiment;
  decision: Decision | null;
  assignedAgentId: string | null;
  handoffId: string | null;
  lastMessageAt: string;
  lastCustomerQuestion: string | null;
  page: string | null;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  organizationId: string;
  conversationId: string;
  role: "customer" | "assistant" | "agent" | "system";
  content: string;
  decision: Decision | null;
  risk: Risk | null;
  model: string | null;
  promptVersion: string | null;
  policyVersion: string | null;
  knowledgeSnapshotVersion: string | null;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
  traceId: string | null;
  trace: Record<string, unknown> | null;
  createdAt: string;
}

export interface Citation {
  id: string;
  organizationId: string;
  messageId: string;
  conversationId: string;
  sourceId: string;
  chunkId: string;
  sourceTitle: string;
  excerpt: string;
  sourceVersion: string;
  effectiveDate: string;
  owner: string;
  score: number;
  createdAt: string;
}

export interface TranscriptEntry {
  id: string;
  role: "customer" | "assistant" | "agent" | "system";
  content: string;
  createdAt: string;
  decision?: Decision | null;
  actorName?: string | null;
}

export interface Handoff {
  id: string;
  organizationId: string;
  conversationId: string;
  queueId: string;
  customerGoal: string;
  summary: string;
  escalationReason: string;
  riskClass: Risk;
  sentiment: Sentiment;
  actionsAttempted: string[];
  sourcesConsulted: {
    sourceId: string;
    title: string;
    version: string;
    key?: string;
  }[];
  claimsAlreadyCommunicated: string[];
  missingInformation: string[];
  recommendedNextAction: string;
  destinationQueue: string;
  fullTranscript: TranscriptEntry[];
  status: "pending_confirmation" | "confirmed" | "claimed" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSource {
  id: string;
  organizationId: string;
  type: SourceType;
  title: string;
  slug: string;
  version: string;
  owner: string;
  authority: Authority;
  effectiveDate: string;
  lastIndexedAt: string | null;
  status: SourceStatus;
  summary: string;
  approvedAnswer: string;
  body: string;
  conflictGroup: string | null;
  staleAfterDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunk {
  id: string;
  organizationId: string;
  sourceId: string;
  chunkIndex: number;
  heading: string;
  content: string;
  tokenCount: number;
  createdAt: string;
}

export interface CustomerEvent {
  id: string;
  organizationId: string;
  customerId: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export type JourneyStatus = "active" | "paused" | "draft";

export interface Journey {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  description: string;
  triggerEvent: string;
  condition: string;
  timing: string;
  subject: string;
  preheader: string;
  primaryAction: string;
  exitRules: string[];
  entryLimit: string | null;
  emailKind: "welcome" | "inactivity" | "feature-update" | "offboarding";
  status: JourneyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyEnrollment {
  id: string;
  organizationId: string;
  journeyId: string;
  customerId: string;
  status: "active" | "completed" | "suppressed" | "cancelled";
  suppressionReason: string | null;
  dedupeKey: string | null;
  enteredAt: string;
  completedAt: string | null;
  updatedAt: string;
}

export interface JourneyRun {
  id: string;
  organizationId: string;
  journeyId: string;
  enrollmentId: string | null;
  eventType: string;
  eventPayload: Record<string, unknown>;
  status: "enrolled" | "suppressed" | "completed" | "cancelled" | "error";
  detail: string;
  createdAt: string;
}

export type DeliveryStatus =
  | "previewed"
  | "queued"
  | "sent"
  | "failed"
  | "suppressed";

export interface Delivery {
  id: string;
  organizationId: string;
  journeyId: string;
  enrollmentId: string;
  customerId: string;
  recipient: string;
  subject: string;
  preheader: string;
  html: string;
  text: string;
  status: DeliveryStatus;
  provider: string;
  error: string | null;
  attempts: number;
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EvalCategory =
  | "answerable"
  | "unsupported"
  | "escalation"
  | "memory"
  | "injection";

export interface EvalCase {
  id: string;
  organizationId: string;
  caseKey: string;
  category: EvalCategory;
  question: string;
  priorTurns: { role: "customer" | "assistant"; content: string }[];
  context: Record<string, unknown>;
  expectedDecision: Decision;
  expectedSourceIds: string[];
  expectedRisk: Risk;
  forbiddenActions: string[];
  notes: string;
  createdAt: string;
}

export interface EvalMetrics {
  decisionAccuracy: number | null;
  sourceSelectionAccuracy: number | null;
  unsupportedAbstainRate: number | null;
  escalationRecall: number | null;
  unnecessaryEscalationRate: number | null;
  citationCoverage: number | null;
  medianLatencyMs: number | null;
  p95LatencyMs: number | null;
  costPerAnsweredTurnUsd: number | null;
}

export interface EvalRun {
  id: string;
  organizationId: string;
  label: string;
  release: string;
  status: "running" | "completed" | "failed";
  total: number;
  passed: number;
  metrics: EvalMetrics;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface EvalResult {
  id: string;
  organizationId: string;
  runId: string;
  caseId: string;
  caseKey: string;
  category: EvalCategory;
  question: string;
  decision: Decision;
  risk: Risk;
  sourceIds: string[];
  passed: boolean;
  failures: string[];
  latencyMs: number;
  trace: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface Signal {
  code: string;
  label: string;
  detail: string;
  severity: "info" | "warn" | "critical";
  weight: number;
}

export interface RetrievedChunk {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceSlug: string;
  sourceType: SourceType;
  authority: Authority;
  version: string;
  effectiveDate: string;
  owner: string;
  status: SourceStatus;
  heading: string;
  excerpt: string;
  content: string;
  score: number;
  matchedTerms: string[];
  stale: boolean;
  contradiction: string | null;
}

export interface RetrievalResult {
  query: string;
  normalizedQuery: string;
  threshold: number;
  candidates: RetrievedChunk[];
  topScore: number;
  margin: number;
  contradiction: string | null;
  staleTop: boolean;
  mode: "postgres-fts" | "deterministic-lexical";
}

export interface PolicyRule {
  id: string;
  label: string;
  triggered: boolean;
  detail: string;
}

export interface AnswerTrace {
  traceId: string;
  conversationId: string;
  policyVersion: string;
  promptVersion: string;
  knowledgeSnapshotVersion: string;
  decision: Decision;
  risk: Risk;
  sentiment: Sentiment;
  signals: Signal[];
  rules: PolicyRule[];
  retrieval: {
    query: string;
    normalizedQuery: string;
    threshold: number;
    topScore: number;
    margin: number;
    mode: string;
    candidateCount: number;
    candidates: {
      sourceId: string;
      sourceTitle: string;
      chunkId: string;
      score: number;
      heading: string;
    }[];
  };
  answerability: {
    score: number;
    sufficient: boolean;
    reasons: string[];
  };
  model: string;
  tokens: { input: number; output: number };
  latencyMs: number;
  estimatedCostUsd: number;
  costBasis: "no-charge-deterministic" | "configured-price" | "pricing-unconfigured";
  verification: {
    passed: boolean;
    checkedClaims: number;
    failures: string[];
  };
  injection: {
    detected: boolean;
    patterns: string[];
  };
  missingFields: string[];
  actionsExecuted: string[];
  degraded: boolean;
  degradedReason?: string;
}

export interface AnswerResponse {
  answer: string;
  decision: Decision;
  risk: Risk;
  sources: {
    id: string;
    key: string;
    chunkId: string;
    title: string;
    excerpt: string;
    version: string;
    effectiveDate: string;
    owner: string;
    score: number;
  }[];
  mode: "deterministic-demo" | "deterministic-fallback" | "model";
  claims: { text: string; sourceIds: string[] }[];
  signals: Signal[];
  escalate: boolean;
  escalationReason: string | null;
  handoffId: string | null;
  conversationId: string;
  model: string;
  latencyMs: number;
  estimatedCostUsd: number;
  costBasis: "no-charge-deterministic" | "configured-price" | "pricing-unconfigured";
  traceId: string;
  sentiment: Sentiment;
  degraded: boolean;
  supportStatus: "online" | "offline";
  handoffStatus: Handoff["status"] | null;
  handoffPreview?: {
    destinationQueue: string;
    includes: string[];
    missingInformation: string[];
    status: Handoff["status"];
  } | null;
  followUp?: string | null;
}
