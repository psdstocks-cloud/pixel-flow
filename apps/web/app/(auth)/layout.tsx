import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <Link href="/" className="brand">
          Pixel Flow
        </Link>
      </header>
      <main className="auth-main">{children}</main>
    </div>
  )
}