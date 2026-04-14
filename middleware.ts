import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // ALLOW these paths without a login
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/logo.png") ||
          pathname.endsWith(".html") // For your static about/contact pages
        ) {
          return true;
        }

        // REQUIRE login for everything else (Dashboard, Admin, etc.)
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/auth (authentication routes)
     * 2. /_next (Next.js internals)
     * 3. /static (static files)
     * 4. favicon.ico, logo.png
     */
    "/((?!api/auth|_next|static|favicon.ico|logo.png).*)",
  ],
};