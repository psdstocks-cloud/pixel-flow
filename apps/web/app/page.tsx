import Link from 'next/link'
import { getRequestLocale } from '../lib/i18n/request'
import { loadHomeMessages } from '../lib/i18n/home'

export default async function HomePage() {
  const locale = getRequestLocale()
  const messages = await loadHomeMessages(locale)
  const { hero, heroGrid } = messages

  return (
    <main className="landing">
      <section className="hero">
        {hero.badge ? <span className="hero-badge">{hero.badge}</span> : null}
        <h1>{hero.headline}</h1>
        <p>{hero.subheadline}</p>
        <div className="hero-actions">
          <Link href="/signup" className="primary">
            {hero.primaryCta.label}
          </Link>
          <Link href="/login" className="secondary">
            {hero.secondaryCta.label}
          </Link>
        </div>
      </section>
      <section className="hero-grid">
        {heroGrid.items.map((item) => (
          <article key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  )
}