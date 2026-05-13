const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.globalSettings.findMany();
  console.log("GlobalSettings count:", settings.length);
  console.log("Settings:", JSON.stringify(settings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
