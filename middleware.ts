import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Canonical host: keep production traffic on abatidigital.com (no www).
  if (process.env.NODE_ENV === "production") {
    const host = nextUrl.hostname.toLowerCase();
    if (host === "www.abatidigital.com") {
      const url = nextUrl.clone();
      url.hostname = "abatidigital.com";
      return NextResponse.redirect(url, 308);
    }
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
  matcher: ["/dashboard/:path*", "/admin/:path*", "/referrals/:path*", "/referrals"],
};
