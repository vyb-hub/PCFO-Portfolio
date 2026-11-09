import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/health", "/api/telegram/webhook"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not authenticated → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // MFA guard: if TOTP is enabled but not verified in this session
  const mfaEnabled = token.totpEnabled as boolean;
  const mfaVerified = token.mfaVerified as boolean;

  if (mfaEnabled && !mfaVerified && !pathname.startsWith("/verify-mfa")) {
    return NextResponse.redirect(new URL("/verify-mfa", req.url));
  }

  // Enforce HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("x-forwarded-proto") !== "https"
  ) {
    const httpsUrl = new URL(req.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl);
  }

  const response = NextResponse.next();

  // Strip server-side response headers that reveal implementation details
  response.headers.delete("x-powered-by");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
