import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditLoggerService } from '@/services/audit-logger.service'
import { prisma } from '@pixel-flow/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Log GDPR data export request
    await AuditLoggerService.logDataPortabilityRequest(
      user.id,
      user.email!,
      'json',
      request as any
    )

    // Fetch all user data
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: {
        orders: true,
        downloads: true,
        transactions: true,
        subscriptions: true,
        payments: true
      }
    })

    return NextResponse.json({
      message: 'Data export request received. You will receive an email with your data within 30 days.',
      requestId: crypto.randomUUID()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process data export request' },
      { status: 500 }
    )
  }
}
