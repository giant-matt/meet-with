import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limit store (per-instance, resets on restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetAt) rateLimitMap.delete(key);
  }
}

function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  cleanup();
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

// Rate limit configuration per endpoint pattern
function getRateLimit(pathname: string, method: string): { max: number; windowMs: number } | null {
  if (method === "POST" && pathname.match(/^\/api\/events\/[^/]+\/verify$/)) {
    return { max: 5, windowMs: 60_000 }; // 5 req/min — brute force protection
  }
  if (method === "POST" && pathname === "/api/events") {
    return { max: 10, windowMs: 60_000 }; // 10 req/min
  }
  if (method === "POST" && pathname.match(/^\/api\/events\/[^/]+\/respond$/)) {
    return { max: 20, windowMs: 60_000 }; // 20 req/min
  }
  if (method === "GET" && pathname === "/api/admin/stats") {
    return { max: 5, windowMs: 60_000 }; // 5 req/min — brute force protection
  }
  if (method === "GET" && pathname === "/api/my-events") {
    return { max: 5, windowMs: 60_000 }; // 5 req/min — email enumeration protection
  }
  if (method === "GET" && pathname.startsWith("/api/")) {
    return { max: 60, windowMs: 60_000 }; // 60 req/min
  }
  if (method === "PUT" || method === "DELETE") {
    return { max: 10, windowMs: 60_000 }; // 10 req/min
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  const limit = getRateLimit(pathname, request.method);
  if (!limit) return NextResponse.next();

  const key = `${ip}:${request.method}:${pathname}`;

  if (isRateLimited(key, limit.max, limit.windowMs)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
