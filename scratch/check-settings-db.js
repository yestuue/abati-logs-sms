const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.globalSettings.findFirst();
    console.log('GlobalSettings:', JSON.stringify(settings, null, 2));
    
    // Check if table exists and columns
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'GlobalSettings'
    `;
    console.log('Columns:', JSON.stringify(columns, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
