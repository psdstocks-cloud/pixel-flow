import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="landing">
      <section className="hero">
        <span className="hero-badge">Pixel Flow Platform</span>
        <h1>All your creative workflows in one place.</h1>
        <p>
          Manage your stock downloads today while we prepare AI image generation and account insights for their upcoming release.
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
          <h2>AI Generation (private beta)</h2>
          <p>
            Request early access to experiment with custom prompts, tailored styles, and automated background cleanup as we polish the workflow.
          </p>
        </article>
        <article>
          <h2>Account Insights (coming soon)</h2>
          <p>
            Soon you’ll visualize balance usage, renewal dates, and order performance in real time to plan your production schedule with confidence.
          </p>
        </article>
      </section>
    </main>
  )
}