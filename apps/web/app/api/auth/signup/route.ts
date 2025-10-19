import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createUser, findUserByEmail } from '../../../../lib/auth'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long').max(80).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'InvalidInput', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { email, password, name } = parsed.data
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'EmailInUse', message: 'An account with this email already exists.' },
        { status: 409 },
      )
    }

    const user = await createUser({ email, password, name })
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[signup]', error)
    return NextResponse.json(
      { error: 'UnexpectedError', message: 'Unable to create account right now.' },
      { status: 500 },
    )
  }
}
