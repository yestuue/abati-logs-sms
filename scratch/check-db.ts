import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const logs = await prisma.log.findMany({
      take: 5
    })
    console.log('Logs found:', logs.length)
    if (logs.length > 0) {
      console.log('First log keys:', Object.keys(logs[0]))
    }
    
    const users = await prisma.user.findMany({
      where: { email: { contains: 'abati' } },
      select: { id: true, email: true }
    })
    console.log('Users found:', users)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
