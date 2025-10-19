import { NextRequest, NextResponse } from 'next/server'
import { verifyUser } from '../../../../lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'MissingToken', message: 'Verification token is required.' },
      { status: 400 },
    )
  }

  try {
    const user = await verifyUser(token)

    // Redirect to login with success message
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('verified', 'true')
    loginUrl.searchParams.set('email', user.email)

    return NextResponse.redirect(loginUrl)
  } catch (error) {
    console.error('[verify]', error)

    const errorMessage = error instanceof Error ? error.message : 'Verification failed'

    // Redirect to login with error
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'verification_failed')
    loginUrl.searchParams.set('message', errorMessage)

    return NextResponse.redirect(loginUrl)
  }
}
