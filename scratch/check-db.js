const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const servers = await prisma.serverConfig.findMany();
  console.log('Servers:', JSON.stringify(servers, null, 2));
  
  const countries = await prisma.country.findMany({ where: { server: 'SERVER1' } });
  console.log('Server 1 Countries:', JSON.stringify(countries, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
