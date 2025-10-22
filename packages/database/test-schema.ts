import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSchema() {
  try {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        balance: 100,
        nehtwApiKey: 'test_key',
      },
    })
    console.log('✅ User created:', user.id)

    const batch = await prisma.batch.create({
      data: {
        userId: user.id,
        totalOrders: 3,
        totalCost: 30,
      },
    })
    console.log('✅ Batch created:', batch.id)

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        taskId: 'test_task_123',
        site: 'adobestock',
        stockId: '123456',
        cost: 10,
        batchId: batch.id,
        batchOrder: 0,
      },
    })
    console.log('✅ Order created:', order.id)

    await prisma.order.delete({ where: { id: order.id } })
    await prisma.batch.delete({ where: { id: batch.id } })
    await prisma.user.delete({ where: { id: user.id } })

    console.log('✅ Schema test passed!')
  } catch (error) {
    console.error('❌ Schema test failed:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void testSchema()
