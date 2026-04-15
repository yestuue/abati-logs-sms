import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isSuperAdminEmail } from "@/lib/admin-access";

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

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;

  // Canonical host guard: strip www before any auth checks.
  if (nextUrl.host === "www.abatidigital.com") {
    const redirectUrl = new URL(request.url);
    redirectUrl.protocol = "https:";
    redirectUrl.host = "abatidigital.com";
    return NextResponse.redirect(redirectUrl, 308);
  }

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

  // Admin hard-gate: only ADMIN role or whitelisted super-admin emails may access /admin.
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const role = typeof token?.role === "string" ? token.role : "";
    const email = typeof token?.email === "string" ? token.email : "";
    if (role !== "ADMIN" && !isSuperAdminEmail(email)) {
      return NextResponse.redirect(new URL("/dashboard", request.url), 307);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};