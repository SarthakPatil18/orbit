import { z } from "zod";

const boolFromString = z
  .string()
  .optional()
  .transform((value) => value === undefined || value === "true" || value === "1");

const optionalNumber = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DEMO_MODE: boolFromString,
  NEXT_PUBLIC_APP_URL: z
    .string()
    .default("http://localhost:3000")
    .refine((v) => /^https?:\/\//.test(v), "must start with http:// or https://"),
  DATABASE_URL: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^postgres(ql)?:\/\//.test(v),
      "must be a postgres:// or postgresql:// URL",
    ),
  STORAGE_DRIVER: z.enum(["auto", "postgres", "file"]).default("auto"),
  PROOFDESK_DATA_DIR: z.string().default(".data"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5"),
  MODEL_INPUT_USD_PER_MILLION: optionalNumber,
  MODEL_OUTPUT_USD_PER_MILLION: optionalNumber,
  EMBEDDING_PROVIDER: z.enum(["none", "voyage"]).default("none"),
  VOYAGE_API_KEY: z.string().optional(),
  EMBEDDING_MODEL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Orbit Demo <support@example.com>"),
  DEMO_EMAIL_TO: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
      "must be a single email address",
    ),
  CRON_SECRET: z.string().optional(),
  RATE_LIMIT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

export function readEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new EnvError(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}

export interface FeatureStatus {
  feature: string;
  status: "real" | "deterministic" | "previewed" | "unavailable" | "configured";
  detail: string;
}

export interface RuntimeConfig {
  demoMode: boolean;
  storageDriver: "postgres" | "file";
  appUrl: string;
  dataDir: string;
  anthropicModel: string;
  hasAnthropicKey: boolean;
  hasEmbeddingKey: boolean;
  embeddingProvider: "none" | "voyage";
  hasResendKey: boolean;
  emailFrom: string;
  demoEmailTo: string | null;
  hasCronSecret: boolean;
  pricingConfigured: boolean;
  modelInputPrice: number | null;
  modelOutputPrice: number | null;
}

export function getRuntimeConfig(): RuntimeConfig {
  const env = readEnv();
  const storageDriver =
    env.STORAGE_DRIVER === "postgres"
      ? "postgres"
      : env.STORAGE_DRIVER === "file"
        ? "file"
        : env.DATABASE_URL
          ? "postgres"
          : "file";
  return {
    demoMode: env.DEMO_MODE,
    storageDriver,
    appUrl: env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""),
    dataDir: env.PROOFDESK_DATA_DIR,
    anthropicModel: env.ANTHROPIC_MODEL,
    hasAnthropicKey: Boolean(env.ANTHROPIC_API_KEY),
    hasEmbeddingKey: Boolean(env.VOYAGE_API_KEY),
    embeddingProvider: env.EMBEDDING_PROVIDER,
    hasResendKey: Boolean(env.RESEND_API_KEY),
    emailFrom: env.EMAIL_FROM,
    demoEmailTo: env.DEMO_EMAIL_TO ?? null,
    hasCronSecret: Boolean(env.CRON_SECRET),
    pricingConfigured:
      env.MODEL_INPUT_USD_PER_MILLION !== null &&
      env.MODEL_OUTPUT_USD_PER_MILLION !== null,
    modelInputPrice: env.MODEL_INPUT_USD_PER_MILLION,
    modelOutputPrice: env.MODEL_OUTPUT_USD_PER_MILLION,
  };
}

export function featureReport(): FeatureStatus[] {
  const c = getRuntimeConfig();
  const modelLive = !c.demoMode && c.hasAnthropicKey;
  return [
    {
      feature: "Answer generation",
      status: modelLive ? "real" : "deterministic",
      detail: modelLive
        ? `Claude (${c.anthropicModel}) with approved excerpts and claim verification.`
        : c.demoMode && c.hasAnthropicKey
          ? "DEMO_MODE is on: the model is intentionally bypassed so reviews are reproducible."
          : "Deterministic composition from approved answers. Policy, retrieval, and citations are real.",
    },
    {
      feature: "Retrieval",
      status: "real",
      detail:
        c.storageDriver === "postgres"
          ? "PostgreSQL full-text search with authority, freshness, and separation checks."
          : "Deterministic lexical retrieval over the seeded knowledge base (PostgreSQL FTS adapter included).",
    },
    {
      feature: "Vector search",
      status:
        c.embeddingProvider === "voyage" && c.hasEmbeddingKey
          ? "configured"
          : "unavailable",
      detail:
        c.embeddingProvider === "voyage" && c.hasEmbeddingKey
          ? "Optional Voyage embeddings are configured; PostgreSQL FTS remains the required baseline."
          : "Optional. PostgreSQL full-text search is the baseline; no embedding key is required.",
    },
    {
      feature: "Persistence",
      status: c.storageDriver === "postgres" ? "real" : "previewed",
      detail:
        c.storageDriver === "postgres"
          ? "PostgreSQL via Drizzle. Tenant-scoped repositories."
          : "File-backed demo store at .data/proofdesk.json. Migrations and the PostgreSQL adapter are included; run docker compose + db:migrate for durable Postgres.",
    },
    {
      feature: "Email delivery",
      status: c.demoMode || !c.hasResendKey ? "previewed" : "real",
      detail:
        c.demoMode || !c.hasResendKey
          ? "Captured in the in-app preview sink. No external email is sent."
          : c.demoEmailTo
            ? `Resend is enabled only for the allowlisted recipient ${c.demoEmailTo}.`
            : "Resend key present but DEMO_EMAIL_TO is empty, so all sends are blocked.",
    },
    {
      feature: "Rate limiting",
      status: "real",
      detail:
        "Per-IP and per-session fixed-window limiter with a local in-memory fallback. Single-instance only.",
    },
    {
      feature: "Cron",
      status: c.hasCronSecret ? "configured" : "previewed",
      detail: c.hasCronSecret
        ? "Inactivity cron requires the configured CRON_SECRET."
        : "Demo mode allows the inactivity cron without a secret. Set CRON_SECRET before deployment.",
    },
  ];
}
