import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/terms",
  "/privacy",
  "/_next",
  "/images",
  "/api/auth",
];

const PUBLIC_FILES = new Set(["/favicon.ico", "/logo.png"]);
const STATIC_FILE_RE = /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$/i;

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_FILES.has(pathname)) return true;
  if (pathname.endsWith(".html")) return true;
  if (STATIC_FILE_RE.test(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { nextUrl, headers } = request;
  const { pathname } = nextUrl;

  // Stop loop: never redirect when already on /login.
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Public routes first: bypass auth checks for public pages/assets.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Canonical host/protocol from NEXTAUTH_URL (prevents old Vercel-host loops).
  const canonical = process.env.NEXTAUTH_URL?.trim();
  if (process.env.NODE_ENV === "production" && canonical) {
    const canonicalUrl = new URL(canonical);
    // SSL guard: if NEXTAUTH_URL was configured as http in production, force https.
    const canonicalProto = canonicalUrl.protocol === "http:" ? "https:" : canonicalUrl.protocol;
    const incomingHost = nextUrl.hostname.toLowerCase();
    const canonicalHost = canonicalUrl.hostname.toLowerCase();
    const forwardedProto = headers.get("x-forwarded-proto")?.toLowerCase();
    const incomingProto = (forwardedProto ?? nextUrl.protocol.replace(":", "")).toLowerCase();
    const canonicalProtoNoColon = canonicalProto.replace(":", "").toLowerCase();

    // Standardize host to non-www canonical host from NEXTAUTH_URL.
    if (incomingHost !== canonicalHost || incomingProto !== canonicalProtoNoColon) {
      const target = nextUrl.clone();
      target.hostname = canonicalUrl.hostname;
      target.protocol = canonicalProto;
      if (canonicalUrl.port) target.port = canonicalUrl.port;
      return NextResponse.redirect(target, 308);
    }
  }

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/referrals");
  if (!isProtected) {
    return NextResponse.next();
  }

  // Edge-safe cookie check for auth session presence.
  const session =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};