import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create packages
  const packages = await Promise.all([
    prisma.package.upsert({
      where: { name: 'Starter' },
      update: {},
      create: {
        name: 'Starter',
        description: 'Perfect for trying out',
        points: 100,
        price: 9.99,
        isPopular: false,
        features: [
          '100 download points',
          'All stock sites supported',
          'Standard speed',
          'Email support',
        ],
      },
    }),
    prisma.package.upsert({
      where: { name: 'Pro' },
      update: {},
      create: {
        name: 'Pro',
        description: 'Best for professionals',
        points: 500,
        price: 39.99,
        isPopular: true,
        features: [
          '500 download points',
          'All stock sites supported',
          'Priority processing',
          'Email & chat support',
          '20% bonus points',
        ],
      },
    }),
    prisma.package.upsert({
      where: { name: 'Business' },
      update: {},
      create: {
        name: 'Business',
        description: 'For teams and agencies',
        points: 1500,
        price: 99.99,
        isPopular: false,
        features: [
          '1500 download points',
          'All stock sites supported',
          'Fastest processing',
          'Priority support',
          '50% bonus points',
          'API access',
        ],
      },
    }),
  ]);

  console.log('✅ Created packages:', packages.length);

  // Create stock sites
  const sites = [
    { name: 'shutterstock', price: 10 },
    { name: 'adobestock', price: 10 },
    { name: 'freepik', price: 8 },
    { name: 'depositphotos', price: 10 },
    { name: 'gettyimages', price: 15 },
    { name: 'istockphoto', price: 12 },
    { name: '123rf', price: 8 },
    { name: 'vecteezy', price: 6 },
    { name: 'flaticon', price: 5 },
    { name: 'envato', price: 12 },
  ];

  for (const site of sites) {
    await prisma.stockSite.upsert({
      where: { name: site.name },
      update: { price: site.price },
      create: {
        name: site.name,
        price: site.price,
        active: true,  // Changed from isActive to active
      },
    });
  }

  console.log('✅ Created stock sites:', sites.length);

  // Give test user 1000 points
  const testUserId = 'cm2rb9yio00008il2t2x91euo';
  const user = await prisma.user.findUnique({ where: { id: testUserId } });
  
  if (user) {
    await prisma.user.update({
      where: { id: testUserId },
      data: { balance: 1000 },
    });
    console.log('✅ Updated test user balance to 1000 points');
  } else {
    console.log('⚠️ Test user not found');
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
