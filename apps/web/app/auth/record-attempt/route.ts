import { NextRequest, NextResponse } from 'next/server'
import { LoginAttemptService } from '@/services/login-attempt.service'

export async function POST(request: NextRequest) {
  try {
    const { email, success, failureReason } = await request.json()
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    await LoginAttemptService.recordAttempt({
      email,
      ipAddress,
      userAgent,
      success,
      failureReason
    })

    // Check if account should be locked
    if (!success) {
      const status = await LoginAttemptService.checkLockoutStatus(email)
      
      if (status.failedAttempts >= 10) {
        await LoginAttemptService.lockAccount(email, ipAddress, status.failedAttempts)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record attempt' },
      { status: 500 }
    )
  }
}
