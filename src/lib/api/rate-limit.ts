interface Bucket {
  count: number;
  resetAt: number;
}

interface LimiterState {
  buckets: Map<string, Bucket>;
}

const globalState = globalThis as unknown as {
  __proofdeskRateLimiter?: LimiterState;
};

function state(): LimiterState {
  if (!globalState.__proofdeskRateLimiter) {
    globalState.__proofdeskRateLimiter = { buckets: new Map() };
  }
  return globalState.__proofdeskRateLimiter;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Fixed-window limiter. Deliberately in-process: adequate for a single-instance
 * demo, documented as not distributed. A production deployment should back this
 * with Redis or the platform edge limiter.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  const buckets = state().buckets;
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt, limit };
  }
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt, limit };
  }
  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
    limit,
  };
}

export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  return `${scope}:${ip}`;
}

export function resetRateLimiterForTests(): void {
  state().buckets.clear();
}
