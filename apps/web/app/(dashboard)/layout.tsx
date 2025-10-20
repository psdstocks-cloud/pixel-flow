import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { AppProviders } from '../providers'
import DashboardNav, { type DashboardNavLink } from './nav-links'
import { authOptions } from '../../lib/auth-options'
import { getRequestLocale, getLocaleDirection } from '../../lib/i18n/request'
import { loadShellMessages } from '../../lib/i18n/shell'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'

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

  const locale = getRequestLocale()
  const dir = getLocaleDirection(locale)
  const shellMessages = await loadShellMessages(locale)

  return (
    <AppProviders locale={locale}>
      <div className="dashboard-shell" dir={dir}>
        <aside className="dashboard-sidebar">
          <Link href="/" className="brand">
            Pixel Flow
          </Link>
          <LanguageSwitcher currentLocale={locale} labels={shellMessages.languageSwitcher} />
          <DashboardNav links={NAV_LINKS} />
        </aside>
        <div className="dashboard-main">
          <main>{children}</main>
        </div>
      </div>
    </AppProviders>
  )
}
