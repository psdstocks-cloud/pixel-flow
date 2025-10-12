import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@pixelflow.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      credits: 10000,
      emailVerified: new Date(),
      storageLimit: 53687091200, // 50GB
    },
  })
  console.log('✅ Admin user created')

  // Create credit packages
  const packages = [
    {
      credits: 50,
      priceUSD: 10.00,
      stripePriceId: 'price_50credits',
      displayName: 'Starter Pack',
      description: 'Perfect for trying out the platform',
      isPopular: false,
      discountPercent: 0,
    },
    {
      credits: 200,
      priceUSD: 35.00,
      stripePriceId: 'price_200credits',
      displayName: 'Popular Pack',
      description: 'Best value - Save 12%',
      isPopular: true,
      discountPercent: 12,
    },
    {
      credits: 500,
      priceUSD: 80.00,
      stripePriceId: 'price_500credits',
      displayName: 'Pro Pack',
      description: 'For power users - Save 20%',
      isPopular: false,
      discountPercent: 20,
    },
  ]

  for (const pkg of packages) {
    await prisma.creditPricing.create({ data: pkg })
  }
  console.log('✅ Credit packages created')

  // Create system configurations
  const configs = [
    {
      key: 'pricing.stock_download',
      value: {
        shutterstock: 0.75,
        adobestock: 0.75,
        freepik: 0.50,
        unsplash: 0.10,
        pexels: 0.10,
        pixabay: 0.10,
        pngtree: 0.60,
      },
      category: 'pricing',
      description: 'Credit cost per stock download by site',
    },
    {
      key: 'pricing.ai_generation',
      value: {
        imagine: 10,
        vary: 5,
        upscale: 3,
      },
      category: 'pricing',
      description: 'Credit cost for AI generation actions',
    },
    {
      key: 'pricing.background_removal',
      value: {
        single: 2,
        batch: 1.5, // per image in batch
      },
      category: 'pricing',
      description: 'Credit cost for background removal',
    },
    {
      key: 'limits.rate_limits',
      value: {
        stock_download: { free: 50, premium: 500, admin: 10000 },
        ai_generation: { free: 20, premium: 200, admin: 10000 },
        background_removal: { free: 30, premium: 300, admin: 10000 },
      },
      category: 'limits',
      description: 'Hourly rate limits by user role',
    },
    {
      key: 'features.welcome_credits',
      value: 20,
      category: 'features',
      description: 'Free credits given to new users',
      isPublic: true,
    },
    {
      key: 'features.storage_limits',
      value: {
        free: 1073741824,      // 1GB
        premium: 10737418240,  // 10GB
        admin: 53687091200,    // 50GB
      },
      category: 'features',
      description: 'Storage limits by user role in bytes',
    },
  ]

  for (const config of configs) {
    await prisma.systemConfig.create({ data: config })
  }
  console.log('✅ System configurations created')

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
