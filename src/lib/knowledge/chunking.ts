import type { KnowledgeChunk, KnowledgeSource } from "@/lib/types";
import { sid } from "@/data/seed/ids";

export function splitChunks(source: KnowledgeSource): KnowledgeChunk[] {
  const sections = source.body
    .split(/\n(?=## )/)
    .map((s) => s.trim())
    .filter(Boolean);
  const usable = sections.length
    ? sections
    : [`## ${source.title}\n${source.body.trim()}`];
  return usable.map((section, index) => {
    const lines = section.split("\n");
    const heading = (lines[0] ?? "Overview").replace(/^##\s*/, "").trim();
    const content = lines.slice(1).join("\n").trim();
    return {
      id: sid(`chunk:${source.slug}:${index}`),
      organizationId: source.organizationId,
      sourceId: source.id,
      chunkIndex: index,
      heading,
      content,
      tokenCount: Math.max(24, Math.round(content.split(/\s+/).length * 1.3)),
      createdAt: source.createdAt,
    };
  });
}
