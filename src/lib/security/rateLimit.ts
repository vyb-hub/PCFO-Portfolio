import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory store for rate limiting (production: use Redis)
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000");
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "100");

// Tighter limits for auth endpoints
const AUTH_LIMITS: Record<string, number> = {
  "/api/auth/totp/verify": 5,
  "/api/auth/totp/setup": 5,
};

export function rateLimit(req: NextRequest): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const path = new URL(req.url).pathname;
  const max = AUTH_LIMITS[path] ?? MAX_REQUESTS;
  const key = `${ip}:${path}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count++;

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);
