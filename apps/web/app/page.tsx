import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="landing">
      <section className="hero">
        <span className="hero-badge">Pixel Flow Platform</span>
        <h1>All your creative workflows in one place.</h1>
        <p>
          Manage stock downloads, AI image generation, and design resources with a unified points-based system built for creative teams.
        </p>
        <div className="hero-actions">
          <Link href="/signup" className="primary">
            Get started
          </Link>
          <Link href="/login" className="secondary">
            Sign in
          </Link>
        </div>
      </section>
      <section className="hero-grid">
        <article>
          <h2>Stock Order Workflow</h2>
          <p>
            Preview costs, queue up to five links at once, and access completed downloads from one dashboard.
          </p>
        </article>
        <article>
          <h2>AI Generation</h2>
          <p>
            Generate bespoke imagery with curated prompts and automated background removal.
          </p>
        </article>
        <article>
          <h2>Account Insights</h2>
          <p>
            Track balance usage, renewal dates, and order history to stay ahead of your production schedule.
          </p>
        </article>
      </section>
    </main>
  )
}