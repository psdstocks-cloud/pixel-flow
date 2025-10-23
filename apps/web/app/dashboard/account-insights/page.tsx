export const dynamic = 'force-dynamic'
import { Card } from '../../../components'

export default function AccountInsightsPage() {
  return (
    <main>
      <section className="order-hero">
        <span className="hero-badge">Account insights</span>
        <h1>Insights arrive soon</h1>
        <p className="hero-description">
          We’re building a live dashboard for balance usage, renewal reminders, and order performance analytics. Stay tuned.
        </p>
      </section>

      <div className="glass-grid">
        <Card title="What to expect" description="Here’s a preview of the dashboards we’re finishing up.">
          <ul className="insights-preview-list">
            <li>Balance timeline with renewal countdowns.</li>
            <li>Order breakdown by provider and cost.</li>
            <li>Download recovery shortcuts for popular assets.</li>
          </ul>
        </Card>
      </div>
    </main>
  )
}
