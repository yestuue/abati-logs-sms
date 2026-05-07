import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Running manual schema update SQL...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Log" ADD COLUMN IF NOT EXISTS "userId" TEXT;
      ALTER TABLE "Log" ADD COLUMN IF NOT EXISTS "purchasedAt" TIMESTAMP(3);
    `)
    console.log('Columns added (or already exist).')
    
    // Check if constraint exists, if not add it
    // Note: This is a bit tricky with executeRawUnsafe depending on the DB
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Log" ADD CONSTRAINT "Log_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        `)
        console.log('Constraint added.')
    } catch (e) {
        console.log('Constraint might already exist or error adding it (skipping).')
    }

  } catch (error) {
    console.error('Error during SQL execution:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
