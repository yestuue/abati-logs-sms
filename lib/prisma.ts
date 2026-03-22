import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Always cache on globalThis — critical for Vercel serverless to avoid
// exhausting Supabase connection limits across warm function invocations.
globalForPrisma.prisma = prisma;

export default prisma;
