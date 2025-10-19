'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import { Card, Field, Toast } from '../../../components'
import { useSession } from '../../../lib/session'

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(80).optional(),
  email: z.string().email({ message: 'Enter a valid email address.' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[0-9]/, { message: 'Include at least one number.' })
    .regex(/[A-Za-z]/, { message: 'Include at least one letter.' }),
  agree: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms to continue.' }) }),
})

type SignupFormState = {
  name: string
  email: string
  password: string
  agree: boolean
}

export default function SignupPage() {
  const router = useRouter()
  const { status, session } = useSession()
  const [formState, setFormState] = useState<SignupFormState>({
    name: '',
    email: '',
    password: '',
    agree: false,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)

  if (status === 'ready' && session?.userId) {
    router.replace('/stock/order')
  }

  const updateField = (field: keyof SignupFormState, value: string | boolean) => {
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    const parsed = signupSchema.safeParse(formState)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0]
        if (typeof field === 'string') {
          fieldErrors[field] = issue.message
        }
      })
      setFormErrors(fieldErrors)
      return
    }

    setSubmitting(true)
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formState.name || undefined,
        email: formState.email,
        password: formState.password,
      }),
    })
    setSubmitting(false)

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null
      setFeedback({
        type: 'error',
        message: body?.message ?? 'Unable to create your account. Please try again later.',
      })
      return
    }

    setFeedback({
      type: 'success',
      message: 'Account created! Check your email to activate your account.',
    })

    await signIn('credentials', {
      email: formState.email,
      password: formState.password,
      redirect: false,
      callbackUrl: '/stock/order',
    })
    router.replace(`/verify?email=${encodeURIComponent(formState.email)}`)
  }

  return (
    <section className="auth-card">
      <Card title="Create your account" description="Sign up to manage stock downloads and creative tools.">
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <Field label="Full name" error={formErrors.name}>
            <input
              type="text"
              value={formState.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </Field>

          <Field label="Email" error={formErrors.email}>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>

          <Field
            label="Password"
            error={formErrors.password}
            hint="Use at least 8 characters, including a number."
          >
            <input
              type="password"
              value={formState.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
            />
          </Field>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={formState.agree}
              onChange={(event) => updateField('agree', event.target.checked)}
            />
            I agree to the Terms of Service and Privacy Policy.
            {formErrors.agree ? <span className="field-error">{formErrors.agree}</span> : null}
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <footer className="auth-footer">
          <span>Already have an account?</span>
          <Link href="/login">Sign in</Link>
        </footer>
      </Card>

      {feedback ? (
        <Toast
          title={feedback.type === 'error' ? 'Signup failed' : 'Signup successful'}
          message={feedback.message}
          variant={feedback.type}
        />
      ) : null}
    </section>
  )
}
