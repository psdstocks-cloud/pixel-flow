import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample packages
  const packages = await Promise.all([
    prisma.package.create({
      data: {
        name: "Starter",
        description: "Perfect for individuals getting started",
        credits: 100,
        price: 9.99,
        isPopular: false,
        features: [
          "100 download credits",
          "All stock sites supported",
          "Standard processing speed",
          "Email support"
        ]
      }
    }),
    prisma.package.create({
      data: {
        name: "Professional",
        description: "For professionals and content creators",
        credits: 500,
        price: 39.99,
        isPopular: true,
        features: [
          "500 download credits",
          "All stock sites supported",
          "Fast processing",
          "Priority email support",
          "20% bonus credits"
        ]
      }
    }),
    prisma.package.create({
      data: {
        name: "Business",
        description: "For teams and agencies",
        credits: 1500,
        price: 99.99,
        isPopular: false,
        features: [
          "1500 download credits",
          "All stock sites supported",
          "Fastest processing",
          "Priority support",
          "50% bonus credits",
          "API access"
        ]
      }
    })
  ]);

  console.log(`✅ Created ${packages.length} packages`);

  // Create sample stock sites (if you have StockSite model)
  // Uncomment if needed:
  // const sites = await Promise.all([
  //   prisma.stockSite.create({
  //     data: {
  //       name: "Shutterstock",
  //       domain: "shutterstock.com",
  //       isActive: true
  //     }
  //   })
  // ]);

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
