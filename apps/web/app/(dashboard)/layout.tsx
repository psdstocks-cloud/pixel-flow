import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth-options'
import DashboardNav, { type DashboardNavLink } from './nav-links'

const NAV_LINKS: DashboardNavLink[] = [
  { href: '/stock/order', label: 'Stock order' },
  { href: '/downloads', label: 'Downloads' },
  { href: '/billing', label: 'Billing' },
  { href: '/ai-generation', label: 'AI generation (beta)', soon: true },
  { href: '/account-insights', label: 'Account insights', soon: true },
]

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link href="/" className="brand">
          Pixel Flow
        </Link>
        <DashboardNav links={NAV_LINKS} />
      </aside>
      <div className="dashboard-main">{children}</div>
    </div>
  )
}
