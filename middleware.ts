import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Public routes/assets should never be auth-gated.
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname === "/logo.png" ||
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$/i.test(pathname);

  // Read canonical origin from NEXTAUTH_URL to prevent stale Vercel-host redirects.
  const canonicalRaw = process.env.NEXTAUTH_URL?.trim();
  if (canonicalRaw) {
    const canonical = new URL(canonicalRaw);
    const incomingHost = nextUrl.hostname.toLowerCase();
    const canonicalHost = canonical.hostname.toLowerCase();
    const incomingProto = nextUrl.protocol.toLowerCase();
    const canonicalProto = canonical.protocol.toLowerCase();

    // Redirect once to canonical host/protocol only when there is an actual mismatch.
    if (incomingHost !== canonicalHost || incomingProto !== canonicalProto) {
      const url = nextUrl.clone();
      url.hostname = canonical.hostname;
      url.protocol = canonical.protocol;
      // Respect explicit canonical port if present.
      if (canonical.port) url.port = canonical.port;
      return NextResponse.redirect(url, 308);
    }
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Directly check the session cookie - This is 100% Edge-Safe
  const session = request.cookies.get("authjs.session-token") ||
                  request.cookies.get("__Secure-authjs.session-token");

  // Define protected areas
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isAdmin = nextUrl.pathname.startsWith("/admin");
  const isReferrals = nextUrl.pathname.startsWith("/referrals");

  // Redirect if no session found
  if ((isDashboard || isAdmin || isReferrals) && !session) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
}

// Match only the routes that need protection
export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
