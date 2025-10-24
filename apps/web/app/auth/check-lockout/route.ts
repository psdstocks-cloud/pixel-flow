import { NextRequest, NextResponse } from 'next/server'
import { LoginAttemptService } from '@/services/login-attempt.service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    const status = await LoginAttemptService.checkLockoutStatus(email)

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check lockout status' },
      { status: 500 }
    )
  }
}
