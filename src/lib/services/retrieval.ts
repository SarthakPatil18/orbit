import type { Store } from "@/lib/store";
import type {
  KnowledgeChunk,
  KnowledgeSource,
  RetrievedChunk,
  RetrievalResult,
} from "@/lib/types";

export const RETRIEVAL_THRESHOLD = 0.35;

export function publicSourceKey(slug: string): string {
  return slug === "exporting-attendees" ? "kb-attendee-export" : slug;
}
export const KNOWLEDGE_SNAPSHOT = "kb-2026.11.3";

const STOPWORDS = new Set(
  `a an and are as at be been being but by can could did do does doing for from had has have having he her here hers him his how i if in into is it its just me more most my no nor not now of off on only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours please orbit tell show know get got want need help thanks thank`.split(
    /\s+/,
  ),
);

const SYNONYMS: Record<string, string> = {
  exporting: "export",
  exports: "export",
  exported: "export",
  download: "export",
  downloads: "export",
  csv: "export",
  xlsx: "export",
  spreadsheet: "export",
  payments: "payment",
  paying: "payment",
  pay: "payment",
  paid: "paid",
  charge: "charge",
  charged: "charge",
  charges: "charge",
  billing: "billing",
  attendees: "attendee",
  attendee: "attendee",
  registration: "attendee",
  registrations: "attendee",
  registered: "attendee",
  register: "attendee",
  registrant: "attendee",
  registrants: "attendee",
  guests: "attendee",
  guest: "attendee",
  ticket: "ticket",
  tickets: "ticket",
  refunds: "refund",
  refunded: "refund",
  reimbursement: "refund",
  reimbursements: "refund",
  reversal: "refund",
  chargeback: "refund",
  cancelling: "cancel",
  cancellation: "cancel",
  canceled: "cancel",
  cancelled: "cancel",
  canceling: "cancel",
  downgrade: "cancel",
  downgraded: "cancel",
  downgrades: "cancel",
  deleting: "delete",
  deletion: "delete",
  deleted: "delete",
  erase: "delete",
  erased: "delete",
  removal: "delete",
  remove: "delete",
  destroy: "delete",
  checkin: "checkin",
  checkins: "checkin",
  scan: "checkin",
  scans: "checkin",
  scanning: "checkin",
  scanner: "checkin",
  qr: "checkin",
  door: "checkin",
  offline: "offline",
  wifi: "offline",
  connection: "offline",
  roles: "role",
  role: "role",
  permissions: "role",
  permission: "role",
  access: "role",
  announcements: "announcement",
  announcement: "announcement",
  reminders: "announcement",
  reminder: "announcement",
  newsletter: "announcement",
  privacy: "privacy",
  retention: "retention",
  records: "data",
  workspace: "workspace",
  workspaces: "workspace",
  organization: "workspace",
  club: "workspace",
  society: "workspace",
  committee: "workspace",
  venue: "venue",
  auditorium: "venue",
  hall: "venue",
  room: "venue",
  grounds: "venue",
  reserve: "reserve",
  reserving: "reserve",
  booking: "reserve",
  book: "reserve",
  students: "student",
  student: "student",
  guarantee: "guarantee",
  guaranteed: "guarantee",
  promise: "guarantee",
  ensure: "guarantee",
  humans: "human",
  human: "human",
  person: "human",
  representative: "human",
  agent: "human",
  someone: "human",
  supervisor: "human",
  prompts: "prompt",
  prompt: "prompt",
  instructions: "prompt",
  instruction: "prompt",
  developer: "prompt",
  hidden: "prompt",
  bypass: "bypass",
  ignore: "bypass",
  override: "bypass",
  jailbreak: "bypass",
  compromise: "security",
  compromised: "security",
  hacked: "security",
  unauthorized: "security",
  unauthorised: "security",
  suspicious: "security",
  security: "security",
  ceo: "executive",
  founder: "executive",
  personal: "personal",
  phone: "phone",
  mobile: "phone",
  number: "phone",
  create: "create",
  creating: "create",
  created: "create",
  creates: "create",
  publish: "publish",
  publishing: "publish",
  published: "publish",
  publishes: "publish",
  edit: "edit",
  editing: "edit",
  edited: "edit",
  edits: "edit",
  issue: "issue",
  issuing: "issue",
  issued: "issue",
  issues: "issue",
  refunding: "refund",
};

const STOPWORD_EXTRA = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "then",
  "than",
  "so",
  "because",
  "while",
  "about",
  "after",
  "before",
  "during",
  "again",
  "still",
  "very",
  "really",
  "today",
  "tomorrow",
  "yesterday",
  "using",
  "use",
  "make",
  "made",
  "thing",
  "things",
  "way",
  "ways",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function stem(token: string): string {
  if (SYNONYMS[token]) return SYNONYMS[token];
  let t = token;
  if (t.endsWith("ies") && t.length > 4) t = `${t.slice(0, -3)}y`;
  else if (t.endsWith("ing") && t.length > 5) t = t.slice(0, -3);
  else if (t.endsWith("ed") && t.length > 4) t = t.slice(0, -2);
  else if (t.endsWith("es") && t.length > 4) t = t.slice(0, -2);
  else if (t.endsWith("s") && !t.endsWith("ss") && t.length > 3) t = t.slice(0, -1);
  return SYNONYMS[t] ?? t;
}

export function normalizeTerms(text: string): string[] {
  const terms = tokenize(text)
    .filter((t) => !STOPWORDS.has(t) && !STOPWORD_EXTRA.has(t))
    .map(stem)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
  return [...new Set(terms)];
}

function isStale(source: KnowledgeSource): boolean {
  if (source.status === "stale" || source.status === "archived") return true;
  const effective = new Date(source.effectiveDate).getTime();
  if (Number.isNaN(effective)) return false;
  const staleAt = effective + source.staleAfterDays * 86_400_000;
  return Date.now() > staleAt;
}

function excerptFor(content: string, terms: string[]): string {
  const lower = content.toLowerCase();
  let index = -1;
  for (const term of terms) {
    const at = lower.indexOf(term.slice(0, Math.max(4, term.length - 1)));
    if (at >= 0 && (index < 0 || at < index)) index = at;
  }
  const start = index > 80 ? index - 80 : 0;
  const slice = content.slice(start, start + 300).trim();
  return start > 0 ? `…${slice}` : slice;
}

interface Scored {
  chunk: KnowledgeChunk;
  source: KnowledgeSource;
  score: number;
  matchedTerms: string[];
}

export async function retrieveEvidence(
  store: Store,
  orgId: string,
  query: string,
  options: { threshold?: number; limit?: number } = {},
): Promise<RetrievalResult> {
  const threshold = options.threshold ?? RETRIEVAL_THRESHOLD;
  const limit = options.limit ?? 8;
  const sources = await store.listSources(orgId);
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const chunks = await store.listChunks(orgId);
  const approved = sources.filter(
    (s) => s.status === "active" || s.status === "stale",
  );
  const approvedIds = new Set(approved.map((s) => s.id));
  const eligible = chunks.filter((c) => approvedIds.has(c.sourceId));

  const terms = normalizeTerms(query);
  const normalizedQuery = terms.join(" ");

  let ftsIds = new Set<string>();
  let mode: RetrievalResult["mode"] = "deterministic-lexical";
  if (store.kind === "postgres") {
    mode = "postgres-fts";
    try {
      const fts = await store.searchChunks(orgId, normalizedQuery || query, 40);
      ftsIds = new Set(fts.map((f) => f.chunkId));
    } catch {
      mode = "deterministic-lexical";
    }
  }

  if (!terms.length) {
    return {
      query,
      normalizedQuery,
      threshold,
      candidates: [],
      topScore: 0,
      margin: 0,
      contradiction: null,
      staleTop: false,
      mode,
    };
  }

  const df = new Map<string, number>();
  for (const term of terms) {
    let count = 0;
    for (const chunk of eligible) {
      const source = sourceById.get(chunk.sourceId);
      if (!source) continue;
      const haystack = `${source.title} ${source.summary} ${chunk.heading} ${chunk.content}`.toLowerCase();
      if (haystack.includes(term.slice(0, Math.max(4, term.length - 1)))) count += 1;
    }
    df.set(term, count);
  }
  const total = Math.max(1, eligible.length);

  const scored: Scored[] = [];
  for (const chunk of eligible) {
    const source = sourceById.get(chunk.sourceId);
    if (!source) continue;
    const heading = chunk.heading.toLowerCase();
    const title = source.title.toLowerCase();
    const summary = source.summary.toLowerCase();
    const content = chunk.content.toLowerCase();
    let weighted = 0;
    let weightTotal = 0;
    const matched: string[] = [];
    for (const term of terms) {
      const documentFrequency = df.get(term) ?? 0;
      if (documentFrequency === 0) continue;
      const probe = term.slice(0, Math.max(4, term.length - 1));
      let hit = 0;
      if (heading.includes(probe)) hit = 1;
      else if (title.includes(probe)) hit = 0.9;
      else if (summary.includes(probe)) hit = 0.6;
      else if (content.includes(probe)) hit = 0.45;
      if (hit > 0) matched.push(term);
      const occurrences = content.split(probe).length - 1;
      if (occurrences > 1) hit = Math.min(1, hit + 0.03 * (occurrences - 1));
      const idf = Math.log(1 + total / (1 + (df.get(term) ?? 0)));
      weighted += idf * hit;
      weightTotal += idf;
    }
    let score = weightTotal > 0 ? weighted / weightTotal : 0;
    const allInHeadingOrTitle = terms.every(
      (t) =>
        heading.includes(t.slice(0, Math.max(4, t.length - 1))) ||
        title.includes(t.slice(0, Math.max(4, t.length - 1))),
    );
    if (allInHeadingOrTitle) score += 0.06;
    if (normalizedQuery && `${title} ${heading}`.includes(normalizedQuery)) {
      score += 0.05;
    }
    // Prefer sources whose own title matches the query: dedicated articles
    // should outrank broad getting-started summaries and policy pages.
    let titleMatches = 0;
    for (const term of terms) {
      const probe = term.slice(0, Math.max(4, term.length - 1));
      if (title.includes(probe)) titleMatches += 1;
    }
    if (titleMatches) score += 0.025 * titleMatches;
    if (source.authority === "canonical") score += 0.03;
    else if (source.authority === "approved") score += 0.015;
    else score -= 0.04;
    if (isStale(source)) score -= 0.12;
    if (ftsIds.has(chunk.id)) score += 0.04;
    score = Math.max(0, Math.min(1, score));
    scored.push({ chunk, source, score, matchedTerms: matched });
  }

  scored.sort((a, b) => b.score - a.score || a.chunk.chunkIndex - b.chunk.chunkIndex);

  // Prefer the best chunk per source, then allow a second passage from a source
  // when it is materially different. This keeps citations readable.
  const perSource = new Map<string, number>();
  const selected: Scored[] = [];
  for (const item of scored) {
    const count = perSource.get(item.source.id) ?? 0;
    if (count >= 1) continue;
    perSource.set(item.source.id, count + 1);
    selected.push(item);
    if (selected.length >= limit) break;
  }

  const top = selected[0];
  const topScore = top?.score ?? 0;
  const competing = selected.find((s) => s.source.id !== top?.source.id);
  const margin = top ? topScore - (competing?.score ?? 0) : 0;

  let contradiction: string | null = null;
  if (top?.source.conflictGroup) {
    const group = approved.filter(
      (s) =>
        s.conflictGroup === top.source.conflictGroup &&
        s.id !== top.source.id &&
        s.status === "active",
    );
    if (group.length) {
      contradiction = `Multiple active sources share the “${top.source.conflictGroup}” policy group: ${group
        .map((s) => s.title)
        .join(", ")}.`;
    }
  }

  const candidates: RetrievedChunk[] = selected.map((s) => ({
    chunkId: s.chunk.id,
    sourceId: s.source.id,
    sourceTitle: s.source.title,
    sourceSlug: s.source.slug,
    sourceType: s.source.type,
    authority: s.source.authority,
    version: s.source.version,
    effectiveDate: s.source.effectiveDate,
    owner: s.source.owner,
    status: s.source.status,
    heading: s.chunk.heading,
    excerpt: excerptFor(s.chunk.content, s.matchedTerms.length ? s.matchedTerms : terms),
    content: s.chunk.content,
    score: Number(s.score.toFixed(4)),
    matchedTerms: s.matchedTerms,
    stale: isStale(s.source),
    contradiction: contradiction,
  }));

  return {
    query,
    normalizedQuery,
    threshold,
    candidates,
    topScore: Number(topScore.toFixed(4)),
    margin: Number(margin.toFixed(4)),
    contradiction,
    staleTop: top ? isStale(top.source) : false,
    mode,
  };
}
