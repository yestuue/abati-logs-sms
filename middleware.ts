// Auth.js v5 middleware — required for Render / any non-Vercel host
// AUTH_TRUST_HOST=true in your Render env vars is what makes this work on a subdomain.
// This file also protects /dashboard and /admin from unauthenticated access.

export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Protect dashboard and admin routes
    "/dashboard/:path*",
    "/admin/:path*",
    // Required: skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|pwa-theme.js).*)",
  ],
};
