import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { DEMO_ORG_ID } from "@/lib/constants";
import { getRuntimeConfig } from "@/lib/env";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    status = 400,
    code = "bad_request",
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function orgId(): string {
  return DEMO_ORG_ID;
}

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("cache-control", "no-store");
  return NextResponse.json(data, { ...init, headers });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return json(
      {
        error: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return json(
      {
        error: "The request did not match the expected shape.",
        code: "validation_error",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  const status =
    error instanceof Error && "status" in error && typeof error.status === "number"
      ? error.status
      : 500;
  if (status >= 500) {
    console.error("[proofdesk:api]", error);
  }
  return json(
    {
      error:
        status >= 500 && getRuntimeConfig().demoMode
          ? message
          : status >= 500
            ? "The server could not complete the request."
            : message,
      code: status >= 500 ? "internal_error" : "request_failed",
    },
    { status },
  );
}

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError("Send a valid JSON body.", 400, "invalid_json");
  }
  return schema.parse(raw);
}

export function parseQuery<T>(url: URL, schema: ZodType<T>): T {
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) raw[key] = value;
  return schema.parse(raw);
}

/**
 * Mutations must come from the same origin. This is a CSRF mitigation for the
 * demo, not an authentication system: there is no multi-tenant login yet.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("host");
  try {
    const originHost = new URL(origin).host;
    if (host && originHost !== host) {
      throw new ApiError("Cross-origin mutation blocked.", 403, "forbidden_origin");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Invalid origin header.", 403, "forbidden_origin");
  }
}

export function requireCronSecret(request: Request): void {
  const config = getRuntimeConfig();
  if (config.demoMode && !config.hasCronSecret) return;
  const configured = process.env.CRON_SECRET;
  const provided =
    request.headers.get("x-cron-secret") ??
    new URL(request.url).searchParams.get("secret");
  if (!configured || provided !== configured) {
    throw new ApiError("Cron secret is missing or invalid.", 401, "unauthorized");
  }
}

export async function route(handler: () => Promise<NextResponse>) {
  try {
    return await handler();
  } catch (error) {
    return errorResponse(error);
  }
}
