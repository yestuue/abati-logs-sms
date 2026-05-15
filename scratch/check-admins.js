const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });
    console.log('Admins:', JSON.stringify(users.map(u => ({ id: u.id, username: u.username, email: u.email })), null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
