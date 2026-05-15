const { PrismaClient } = require('@prisma/client');
const { upsertServer2MasterCountries } = require('../lib/server2-master-countries');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Syncing countries...');
    await upsertServer2MasterCountries(prisma);
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
