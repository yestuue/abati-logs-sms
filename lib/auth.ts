import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/admin-access";

/** Credentials + JWT: sign-in reads User from Prisma only. Supabase Auth is not used. */
import bcrypt from "bcryptjs";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  useSecureCookies: isProd,
  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    callbackUrl: {
      name: isProd ? "__Secure-authjs.callback-url" : "authjs.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    csrfToken: {
      name: isProd ? "__Host-authjs.csrf-token" : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalizedEmail = normalizeEmail(email);

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          walletCurrency: user.walletCurrency,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const requestOrigin = new URL(baseUrl).origin;
      const configuredBase = process.env.NEXTAUTH_URL?.trim();
      let origin = requestOrigin;
      if (configuredBase) {
        try {
          const configuredOrigin = new URL(configuredBase).origin;
          if (configuredOrigin === requestOrigin) {
            origin = configuredOrigin;
          }
        } catch {
          origin = requestOrigin;
        }
      }

      let pathname = "/login";
      if (url.startsWith("/")) {
        pathname = url;
      } else {
        try {
          const parsed = new URL(url);
          if (parsed.origin !== origin) return `${origin}/login`;
          pathname = `${parsed.pathname}${parsed.search}`;
        } catch {
          return `${origin}/login`;
        }
      }

      if (pathname.startsWith("/admin")) return `${origin}/admin`;
      if (pathname.startsWith("/dashboard")) return `${origin}/dashboard`;
      if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register")) {
        return `${origin}${pathname}`;
      }
      return `${origin}/login`;
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          const u = user as {
            id?: string;
            email?: string | null;
            role?: string;
            walletBalance?: number;
            walletCurrency?: string;
          };
          token.id = u.id ?? (token.id as string | undefined);
          token.email = u.email ?? (token.email as string | undefined);
          token.role = u.role || "USER";
          token.walletBalance = typeof u.walletBalance === "number" ? u.walletBalance : (token.walletBalance as number | undefined) ?? 0;
          token.walletCurrency = u.walletCurrency || (token.walletCurrency as string | undefined) || "NGN";
        }

        // Keep token in sync with DB so dashboard has required fields.
        const email = typeof token.email === "string" ? normalizeEmail(token.email) : "";
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              role: true,
              walletBalance: true,
              walletCurrency: true,
            },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role || "USER";
            token.walletBalance = dbUser.walletBalance ?? 0;
            token.walletCurrency = dbUser.walletCurrency || "NGN";
          }
        } else {
          token.role = (token.role as string) || "USER";
          token.walletBalance = (token.walletBalance as number | undefined) ?? 0;
          token.walletCurrency = (token.walletCurrency as string | undefined) || "NGN";
        }
      } catch (error) {
        console.error("Auth JWT callback failed:", error);
        token.role = (token.role as string) || "USER";
        token.walletBalance = (token.walletBalance as number | undefined) ?? 0;
        token.walletCurrency = (token.walletCurrency as string | undefined) || "NGN";
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = (token?.id as string) || "";
        session.user.role = (token?.role as string) || "USER";
        session.user.walletBalance = (token?.walletBalance as number) ?? 0;
        session.user.walletCurrency = (token?.walletCurrency as string) || "NGN";
      }
      return session;
    },
  },
});

