import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Always store in globalThis — prevents connection exhaustion on Render/serverless
// where modules can be re-evaluated between requests.
globalForPrisma.prisma ??= new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export const prisma = globalForPrisma.prisma;
