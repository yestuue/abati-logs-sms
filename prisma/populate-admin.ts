/**
 * Populate only Service + Country tables (Admin panel lists).
 *
 *   npx prisma db push
 *   npm run populate:admin
 */
import { PrismaClient } from "@prisma/client";
import { seedAdminLists } from "./seed-admin-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Populating Service and Country tables…");
  await seedAdminLists(prisma);
  console.log(`Done: ${(await prisma.service.count())} services, ${(await prisma.country.count())} countries.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
