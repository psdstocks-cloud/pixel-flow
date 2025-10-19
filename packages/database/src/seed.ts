import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding packages...')

  const packages = [
    {
      name: 'Starter',
      description: 'Perfect for occasional stock downloads',
      points: 100,
      price: 4.99,
      currency: 'USD',
      interval: 'month',
    },
    {
      name: 'Pro',
      description: 'Great for regular content creators',
      points: 500,
      price: 19.99,
      currency: 'USD',
      interval: 'month',
    },
    {
      name: 'Enterprise',
      description: 'Unlimited downloads for teams',
      points: 2000,
      price: 49.99,
      currency: 'USD',
      interval: 'month',
    },
  ]

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { name: pkg.name },
      update: pkg,
      create: pkg,
    })
  }

  console.log('Packages seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
