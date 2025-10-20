import Link from 'next/link'
import './globals.css'
import { AppProviders } from './providers'
import { getRequestLocale, getLocaleDirection } from '../lib/i18n/request'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { loadShellMessages } from '../lib/i18n/shell'

export const metadata = {
  title: 'Pixel Flow',
  description: 'Stock images, AI generation, and design tools',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getRequestLocale()
  const dir = getLocaleDirection(locale)
  const shellMessages = await loadShellMessages(locale)

  return (
    <html lang={locale} dir={dir}>
      <body>
        <AppProviders locale={locale}>
          <header className="app-header">
            <Link href="/" className="brand">
              Pixel Flow
            </Link>
            <LanguageSwitcher currentLocale={locale} labels={shellMessages.languageSwitcher} />
          </header>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}