import type { Store } from "@/lib/store";
import type {
  Authority,
  KnowledgeSource,
  SourceStatus,
  SourceType,
} from "@/lib/types";
import { newId, nowIso, slugify } from "@/lib/ids";
import { audit } from "./audit";
import { splitChunks } from "./chunking";
import { decideAutonomy } from "./policy";
import { retrieveEvidence } from "./retrieval";

export interface CreateSourceInput {
  type: SourceType;
  title: string;
  slug?: string;
  version: string;
  owner: string;
  authority: Authority;
  effectiveDate: string;
  summary: string;
  approvedAnswer: string;
  body: string;
  status?: SourceStatus;
  conflictGroup?: string | null;
  staleAfterDays?: number;
}

export interface UpdateSourceInput {
  title?: string;
  version?: string;
  owner?: string;
  authority?: Authority;
  effectiveDate?: string;
  summary?: string;
  approvedAnswer?: string;
  body?: string;
  status?: SourceStatus;
  conflictGroup?: string | null;
  staleAfterDays?: number;
}

export function isSourceStale(source: KnowledgeSource): boolean {
  if (source.status === "stale" || source.status === "archived") return true;
  const effective = new Date(source.effectiveDate).getTime();
  if (Number.isNaN(effective)) return false;
  return Date.now() > effective + source.staleAfterDays * 86_400_000;
}

export function sourceFlags(
  source: KnowledgeSource,
  all: KnowledgeSource[],
): {
  stale: boolean;
  staleReason: string | null;
  conflicts: { id: string; title: string; status: SourceStatus }[];
} {
  const stale = isSourceStale(source);
  let staleReason: string | null = null;
  if (source.status === "stale") staleReason = "Marked stale by the owner.";
  else if (source.status === "archived") staleReason = "Archived; excluded from retrieval.";
  else if (stale)
    staleReason = `Older than its ${source.staleAfterDays}-day freshness window.`;
  const conflicts = source.conflictGroup
    ? all
        .filter(
          (s) =>
            s.id !== source.id &&
            s.conflictGroup === source.conflictGroup,
        )
        .map((s) => ({ id: s.id, title: s.title, status: s.status }))
    : [];
  return { stale, staleReason, conflicts };
}

export async function createSource(
  store: Store,
  orgId: string,
  input: CreateSourceInput,
  actor = "Knowledge editor",
): Promise<KnowledgeSource> {
  const slug = slugify(input.slug || input.title);
  const existing = await store.getSourceBySlug(orgId, slug);
  if (existing) throw new Error("A source with this slug already exists.");
  const now = nowIso();
  const source: KnowledgeSource = {
    id: newId(),
    organizationId: orgId,
    type: input.type,
    title: input.title,
    slug,
    version: input.version,
    owner: input.owner,
    authority: input.authority,
    effectiveDate: input.effectiveDate,
    lastIndexedAt: now,
    status: input.status ?? "draft",
    summary: input.summary,
    approvedAnswer: input.approvedAnswer,
    body: input.body,
    conflictGroup: input.conflictGroup ?? null,
    staleAfterDays: input.staleAfterDays ?? 180,
    createdAt: now,
    updatedAt: now,
  };
  const created = await store.createSource(orgId, source);
  await store.replaceChunks(orgId, created.id, splitChunks(created));
  await audit(store, {
    organizationId: orgId,
    actor,
    action: "source.created",
    entityType: "knowledge_source",
    entityId: created.id,
    detail: { title: created.title, slug: created.slug, version: created.version },
  });
  return created;
}

export async function updateSource(
  store: Store,
  orgId: string,
  sourceId: string,
  input: UpdateSourceInput,
  actor = "Knowledge editor",
): Promise<KnowledgeSource> {
  const current = await store.getSourceById(orgId, sourceId);
  if (!current) throw new Error("Source not found.");
  const reindex =
    input.body !== undefined ||
    input.title !== undefined ||
    input.approvedAnswer !== undefined;
  const patch: Partial<KnowledgeSource> = {
    ...input,
    ...(reindex ? { lastIndexedAt: nowIso() } : {}),
  };
  const updated = await store.updateSource(orgId, sourceId, patch);
  if (!updated) throw new Error("Source not found.");
  if (reindex) {
    await store.replaceChunks(orgId, sourceId, splitChunks(updated));
  }
  await audit(store, {
    organizationId: orgId,
    actor,
    action: "source.updated",
    entityType: "knowledge_source",
    entityId: sourceId,
    detail: {
      title: updated.title,
      version: updated.version,
      reindexed: reindex,
      status: updated.status,
    },
  });
  return updated;
}

export async function archiveSource(
  store: Store,
  orgId: string,
  sourceId: string,
  actor = "Knowledge editor",
): Promise<KnowledgeSource> {
  const updated = await store.updateSource(orgId, sourceId, {
    status: "archived",
  });
  if (!updated) throw new Error("Source not found.");
  await audit(store, {
    organizationId: orgId,
    actor,
    action: "source.archived",
    entityType: "knowledge_source",
    entityId: sourceId,
    detail: { title: updated.title, version: updated.version },
  });
  return updated;
}

export async function reindexSource(
  store: Store,
  orgId: string,
  sourceId: string,
  actor = "Knowledge editor",
): Promise<KnowledgeSource> {
  const source = await store.getSourceById(orgId, sourceId);
  if (!source) throw new Error("Source not found.");
  const chunks = splitChunks(source);
  await store.replaceChunks(orgId, sourceId, chunks);
  const updated = await store.updateSource(orgId, sourceId, {
    lastIndexedAt: nowIso(),
  });
  await audit(store, {
    organizationId: orgId,
    actor,
    action: "source.reindexed",
    entityType: "knowledge_source",
    entityId: sourceId,
    detail: { title: source.title, version: source.version, chunks: chunks.length },
  });
  return updated ?? source;
}

export async function retrievalPlayground(
  store: Store,
  orgId: string,
  query: string,
  threshold?: number,
) {
  const retrieval = await retrieveEvidence(store, orgId, query, { threshold });
  const policy = decideAutonomy({
    question: query,
    retrieval,
    priorTurns: [],
    failureCount: 0,
  });
  return {
    query,
    normalizedQuery: retrieval.normalizedQuery,
    threshold: retrieval.threshold,
    mode: retrieval.mode,
    topScore: retrieval.topScore,
    margin: retrieval.margin,
    candidates: retrieval.candidates.map((c) => ({
      chunkId: c.chunkId,
      sourceId: c.sourceId,
      sourceTitle: c.sourceTitle,
      sourceSlug: c.sourceSlug,
      type: c.sourceType,
      authority: c.authority,
      version: c.version,
      effectiveDate: c.effectiveDate,
      owner: c.owner,
      heading: c.heading,
      excerpt: c.excerpt,
      score: c.score,
      matchedTerms: c.matchedTerms,
      stale: c.stale,
      status: c.status,
    })),
    decision: policy.decision,
    risk: policy.risk,
    reason: policy.reason,
    clarifyQuestion: policy.clarifyQuestion,
    answerability: policy.answerability,
    signals: policy.signals,
    rules: policy.rules.filter((r) => r.triggered),
    staleTop: retrieval.staleTop,
    contradiction: retrieval.contradiction,
  };
}
