import { randomUUID } from "node:crypto";

export const newId = (): string => randomUUID();
export const nowIso = (): string => new Date().toISOString();

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
