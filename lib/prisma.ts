import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development/serverless
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Singleton pattern: reuse the existing client or create a new one
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// In development, save the client to globalThis so it survives Hot Module Replacement (HMR)
// In Vercel production, this helps keep the connection alive across warm function starts
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;