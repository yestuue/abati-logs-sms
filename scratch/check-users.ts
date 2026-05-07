import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const userCount = await prisma.user.count()
    console.log('Total users:', userCount)
    
    const abatiUser = await prisma.user.findFirst({
      where: { email: { contains: 'abatiemmanuel05' } }
    })
    console.log('Abati User:', abatiUser ? { id: abatiUser.id, email: abatiUser.email } : 'Not found')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
