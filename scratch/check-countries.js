const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const countries = await prisma.country.findMany({
    take: 10,
    select: { id: true, name: true, slug: true, server: true }
  });
  console.log(JSON.stringify(countries, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
