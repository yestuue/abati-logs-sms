const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.$queryRaw`SELECT * FROM "GlobalSettings" LIMIT 1`;
    console.log('GlobalSettings (Raw):', JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
