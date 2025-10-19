import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '../../../lib/auth'
import { createSubscription, getPackageById } from '@pixel-flow/database/subscription'

const subscribeSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = subscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'InvalidInput', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { packageId } = parsed.data

    // Check if package exists and is active
    const pkg = await getPackageById(packageId)
    if (!pkg || !pkg.active) {
      return NextResponse.json(
        { error: 'PackageNotFound', message: 'The selected package is not available.' },
        { status: 404 },
      )
    }

    // For now, create subscription directly without payment
    // TODO: Integrate Stripe checkout
    const subscription = await createSubscription(session.user.id, packageId)

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        package: {
          name: pkg.name,
          points: pkg.points,
        },
      },
    })
  } catch (error) {
    console.error('[billing/subscribe]', error)

    if (error instanceof Error && error.message.includes('Package not found')) {
      return NextResponse.json(
        { error: 'PackageNotFound', message: 'The selected package is not available.' },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { error: 'InternalServerError', message: 'Unable to create subscription.' },
      { status: 500 },
    )
  }
}
