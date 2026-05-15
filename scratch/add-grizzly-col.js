const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding grizzlyId column...');
    await prisma.$executeRawUnsafe('ALTER TABLE "CountryConfig" ADD COLUMN IF NOT EXISTS "grizzlyId" TEXT;');
    console.log('Success!');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
