import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin() {
  const email = 'psdstocks@gmail.com'
  
  const user = await prisma.profile.update({
    where: { email },
    data: { role: 'admin' }
  })

  console.log('✅ User updated to admin:')
  console.log(`   Email: ${user.email}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   ID: ${user.id}`)
}

makeAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
