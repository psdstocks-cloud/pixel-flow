import { getRequestLocale, getLocaleDirection } from '../lib/i18n/request'
import { loadHomeMessages } from '../lib/i18n/home'
import { LandingPageContent } from '../components/landing/LandingPageContent'

export default async function HomePage() {
  const locale = getRequestLocale()
  const messages = await loadHomeMessages(locale)
  const direction = getLocaleDirection(locale)

  return (
    <main className="landing" dir={direction}>
      <LandingPageContent messages={messages} direction={direction} />
    </main>
  )
}