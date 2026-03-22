import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Directly check the session cookie - This is 100% Edge-Safe
  const session = request.cookies.get("authjs.session-token") ||
                  request.cookies.get("__Secure-authjs.session-token");

  const { nextUrl } = request;

  // Define protected areas
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isAdmin = nextUrl.pathname.startsWith("/admin");

  // Redirect if no session found
  if ((isDashboard || isAdmin) && !session) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
}

// Match only the routes that need protection
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
