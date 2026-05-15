const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding iso2 column...');
    await prisma.$executeRawUnsafe('ALTER TABLE "CountryConfig" ADD COLUMN IF NOT EXISTS "iso2" TEXT;');
    console.log('Success!');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
