import type { AuditLog, KnowledgeChunk, KnowledgeSource } from "@/lib/types";
import { getStore } from "@/lib/database";
import { orgId } from "@/lib/api/http";
import { sourceFlags } from "@/lib/knowledge/sources";
import { KnowledgeWorkspace } from "@/components/knowledge/knowledge-workspace";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Knowledge",
  description:
    "Versioned, owned Orbit knowledge with stale and conflict detection, reindexing, and a retrieval playground.",
};

export default async function KnowledgePage() {
  const store = await getStore();
  const org = orgId();
  const [sources, chunks, audits] = await Promise.all([
    store.listSources(org),
    store.listChunks(org),
    store.listAuditLogs(org, 80),
  ]);

  const rows = sources
    .map((source) => ({
      ...source,
      flags: sourceFlags(source, sources),
      chunkCount: chunks.filter((chunk) => chunk.sourceId === source.id).length,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <KnowledgeWorkspace
      initialSources={rows}
      initialAudits={audits}
      totalChunks={chunks.length}
    />
  );
}

export type SourceRow = KnowledgeSource & {
  flags: ReturnType<typeof sourceFlags>;
  chunkCount: number;
};

export type { AuditLog, KnowledgeChunk };
