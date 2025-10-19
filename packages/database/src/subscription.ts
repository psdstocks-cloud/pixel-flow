import { prisma } from './index'

export type PackageWithSubscription = {
  id: string
  name: string
  description: string | null
  points: number
  price: number
  currency: string
  interval: string
  active: boolean
  subscription?: {
    id: string
    status: string
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  } | null
}

export async function getActivePackages(): Promise<PackageWithSubscription[]> {
  return prisma.package.findMany({
    where: { active: true },
    orderBy: { price: 'asc' },
  })
}

export async function getPackageById(id: string) {
  return prisma.package.findUnique({
    where: { id },
  })
}

export async function getUserPackages(userId: string): Promise<PackageWithSubscription[]> {
  return prisma.package.findMany({
    where: { active: true },
    include: {
      subscriptions: {
        where: {
          userId,
          status: { in: ['active', 'canceled'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { price: 'asc' },
  }).then(packages =>
    packages.map(pkg => ({
      ...pkg,
      subscription: pkg.subscriptions[0] || null,
    }))
  )
}

export async function createSubscription(userId: string, packageId: string, stripeSubscriptionId?: string) {
  const pkg = await getPackageById(packageId)
  if (!pkg) throw new Error('Package not found')

  const now = new Date()
  const periodEnd = new Date(now)
  if (pkg.interval === 'year') {
    periodEnd.setFullYear(now.getFullYear() + 1)
  } else {
    periodEnd.setMonth(now.getMonth() + 1)
  }

  return prisma.$transaction(async (tx) => {
    // Create subscription
    const subscription = await tx.userSubscription.create({
      data: {
        userId,
        packageId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId,
      },
    })

    // Credit initial points
    await tx.userBalance.upsert({
      where: { userId },
      update: { points: { increment: pkg.points } },
      create: { userId, points: pkg.points },
    })

    return subscription
  })
}

export async function renewSubscription(subscriptionId: string) {
  return prisma.$transaction(async (tx) => {
    const subscription = await tx.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { package: true },
    })

    if (!subscription || subscription.status !== 'active') {
      throw new Error('Subscription not found or not active')
    }

    const now = new Date()
    const periodEnd = new Date(now)
    if (subscription.package.interval === 'year') {
      periodEnd.setFullYear(now.getFullYear() + 1)
    } else {
      periodEnd.setMonth(now.getMonth() + 1)
    }

    // Update subscription period
    const updatedSubscription = await tx.userSubscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      },
    })

    // Credit renewal points
    await tx.userBalance.upsert({
      where: { userId: subscription.userId },
      update: { points: { increment: subscription.package.points } },
      create: { userId: subscription.userId, points: subscription.package.points },
    })

    return updatedSubscription
  })
}

export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
  return prisma.userSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: cancelAtPeriodEnd ? 'active' : 'canceled',
      cancelAtPeriodEnd,
    },
  })
}

export async function getExpiringSubscriptions(hoursUntilExpiry = 24) {
  const expiryThreshold = new Date(Date.now() + hoursUntilExpiry * 60 * 60 * 1000)

  return prisma.userSubscription.findMany({
    where: {
      status: 'active',
      currentPeriodEnd: {
        lte: expiryThreshold,
      },
    },
    include: {
      user: true,
      package: true,
    },
  })
}

export async function processExpiredSubscriptions() {
  const now = new Date()

  return prisma.$transaction(async (tx) => {
    // Find expired subscriptions
    const expired = await tx.userSubscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: { lte: now },
      },
    })

    // Update status
    await tx.userSubscription.updateMany({
      where: {
        status: 'active',
        currentPeriodEnd: { lte: now },
      },
      data: { status: 'expired' },
    })

    return expired
  })
}
