import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/", "/login", "/register", "/api/auth", "/terms", "/privacy", "/_next", "/images"];

const PUBLIC_FILES = new Set(["/favicon.ico", "/logo.png", "/robots.txt", "/sitemap.xml"]);
const STATIC_FILE_RE =
  /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml|woff|woff2|ttf|eot|webmanifest|json)$/i;

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_FILES.has(pathname)) return true;
  if (pathname.endsWith(".html")) return true;
  if (STATIC_FILE_RE.test(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;

  // Stop loop: never redirect when already on /login.
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Public routes first: bypass auth checks for public pages/assets.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/referrals");
  if (!isProtected) {
    return NextResponse.next();
  }

  // Edge-safe cookie check for auth session presence.
  const session =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};