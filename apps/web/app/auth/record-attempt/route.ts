import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, success, failureReason } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get IP address from request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined

    // Call backend API to record login attempt
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/record-attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        success: success || false,
        failureReason,
        ipAddress,
        userAgent
      })
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Record login attempt error:', error)
    return NextResponse.json(
      { error: 'Failed to record login attempt' },
      { status: 500 }
    )
  }
}
