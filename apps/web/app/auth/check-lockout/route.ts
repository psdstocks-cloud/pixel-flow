import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Call backend API to check lockout status
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-lockout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Check lockout error:', error)
    return NextResponse.json(
      { error: 'Failed to check lockout status' },
      { status: 500 }
    )
  }
}
