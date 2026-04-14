import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("[Prisma] DATABASE_URL is not set in environment variables.");
  }

  return new PrismaClient({
    log: ["error"],
    datasources: {
      db: { url },
    },
  });
}

export const prisma = global.prisma ?? createPrismaClient();

global.prisma = prisma;

export default prisma;
