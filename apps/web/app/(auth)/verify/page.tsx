import Link from 'next/link'

type VerifyPageProps = {
  searchParams: {
    email?: string
  }
}

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  const email = searchParams.email ?? 'your email'
  return (
    <section className="auth-card">
      <h1>Check your inbox</h1>
      <p>
        We sent a verification link to <strong>{email}</strong>. Click the link to activate your account, then return to{' '}
        <Link href="/login">the login page</Link>.
      </p>
      <p>
        Didn’t receive the email? Check your spam folder or{' '}
        <Link href="/signup">try signing up again</Link>.
      </p>
    </section>
  )
}