import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { normalizeEmail } from "@/lib/admin-access";

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

/**
 * Edge auth + route guard. ADMIN users bypass further restrictions so they can
 * move between /dashboard and /admin without redirect loops.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { nextUrl } = request;
  const { pathname } = nextUrl;

  if (nextUrl.host === "www.abatidigital.com") {
    const redirectUrl = new URL(request.url);
    redirectUrl.protocol = "https:";
    redirectUrl.host = "abatidigital.com";
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/referrals");
  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionCookie) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url), 307);
    }
    return NextResponse.redirect(new URL("/login", request.url), 307);
  }
  let sessionRole: string | undefined;
  let sessionEmail = "";
  let isBanned = false;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const role = typeof token?.role === "string" ? token.role : "";
    sessionRole = role || undefined;
    sessionEmail = typeof token?.email === "string" ? normalizeEmail(token.email) : "";
    isBanned = !!token?.isBanned;
    console.log("Current User Role:", sessionRole);
  } catch (error) {
    console.error("Proxy session fetch failed:", error);
    return NextResponse.redirect(new URL("/login?error=session", request.url), 307);
  }

  const isPrivilegedAdminEmail =
    sessionEmail === "abatiemmanuel24@gmail.com" || sessionEmail === "growthprofesors@gmail.com";

  if (isBanned) {
    return NextResponse.redirect(new URL("/login?error=banned", request.url), 307);
  }

  // Admin routes are private and never shown to non-admin users.
  if (pathname.startsWith("/admin")) {
    if (sessionRole === "ADMIN" || isPrivilegedAdminEmail) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", request.url), 307);
  }

  // God Mode: admins can access /dashboard and /admin freely.
  if (sessionRole === "ADMIN" || isPrivilegedAdminEmail) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
