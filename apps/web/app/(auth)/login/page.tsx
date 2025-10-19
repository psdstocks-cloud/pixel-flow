'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import { Card, Field, Toast } from '../../../components'
import { useSession } from '../../../lib/session'

const loginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  remember: z.boolean().optional(),
})

type LoginFormState = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, status, refresh } = useSession()
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
    remember: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)

  const callbackUrl = useMemo(() => searchParams.get('callbackUrl') ?? '/stock/order', [searchParams])

  useEffect(() => {
    if (status === 'ready' && session?.userId) {
      router.replace(callbackUrl)
    }
  }, [status, session?.userId, router, callbackUrl])

  const updateField = (field: keyof LoginFormState, value: string | boolean) => {
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

    const parsed = loginSchema.safeParse(formState)
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
    const response = await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      callbackUrl,
    })
    setSubmitting(false)

    if (!response || response.error) {
      setFeedback({ type: 'error', message: 'Invalid email or password. Please try again.' })
      return
    }

    await refresh()
    router.replace(response.url ?? callbackUrl)
  }

  return (
    <section className="auth-card">
      <Card title="Welcome back" description="Enter your credentials to access the dashboard.">
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <Field label="Email" error={formErrors.email}>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>

          <Field label="Password" error={formErrors.password}>
            <input
              type="password"
              value={formState.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={formState.remember}
              onChange={(event) => updateField('remember', event.target.checked)}
            />
            Remember me
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <footer className="auth-footer">
          <span>New to Pixel Flow?</span>
          <Link href="/signup">Create an account</Link>
        </footer>
      </Card>

      {feedback ? (
        <Toast
          title={feedback.type === 'error' ? 'Unable to sign in' : 'Signed in'}
          message={feedback.message}
          variant={feedback.type}
        />
      ) : null}
    </section>
  )
}
