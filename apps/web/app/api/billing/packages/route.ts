import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth-options'
import { getUserPackages } from '@pixel-flow/database/subscription'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const packages = await getUserPackages(session.user.id)
    return NextResponse.json(packages)
  } catch (error) {
    console.error('[billing/packages]', error)
    return NextResponse.json(
      { error: 'InternalServerError', message: 'Unable to fetch packages.' },
      { status: 500 },
    )
  }
}
