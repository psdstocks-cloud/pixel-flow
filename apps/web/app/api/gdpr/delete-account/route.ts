import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()

    // Get session for auth token
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      return NextResponse.json({ error: 'No valid session' }, { status: 401 })
    }

    // Call backend API to handle GDPR deletion with audit logging
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gdpr/delete-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ 
        userId: user.id,
        email: user.email,
        reason: reason || 'User requested account deletion'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend request failed' }))
      return NextResponse.json(
        { error: errorData.error || 'Failed to process deletion request' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      message: 'Account deletion request received. Your account will be deleted within 30 days.',
      requestId: crypto.randomUUID(),
      ...data
    })
  } catch (error) {
    console.error('Account deletion request error:', error)
    return NextResponse.json(
      { error: 'Failed to process account deletion request' },
      { status: 500 }
    )
  }
}
