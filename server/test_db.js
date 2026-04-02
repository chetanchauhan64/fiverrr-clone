import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const logs = await prisma.loginLog.findMany({ take: 1 })
    console.log('LoginLog table exists.')
  } catch (e) {
    console.error('LoginLog table does NOT exist or error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
