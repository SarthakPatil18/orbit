import { createHash } from "node:crypto";

/**
 * Stable, UUID-shaped identifiers so the same seed produces the same rows in
 * both the file adapter and PostgreSQL. Never use this for user-created rows.
 */
export function stableId(key: string): string {
  const h = createHash("sha256").update(`proofdesk:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(
    17,
    20,
  )}-${h.slice(20, 32)}`;
}

export const sid = stableId;
