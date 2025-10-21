import './globals.css'
import { AppProviders } from './providers'
import { getRequestLocale, getLocaleDirection } from '../lib/i18n/request'
import { loadShellMessages } from '../lib/i18n/shell'
import { LandingHeader } from '../components/LandingHeader'

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
          <LandingHeader locale={locale} labels={shellMessages.navigation} languageSwitcher={shellMessages.languageSwitcher} />
          {children}
        </AppProviders>
      </body>
    </html>
  )
}