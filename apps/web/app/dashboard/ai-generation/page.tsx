export const dynamic = 'force-dynamic'
import { Card } from '../../../components'

export default function AiGenerationPage() {
  return (
    <main>
      <section className="order-hero">
        <span className="hero-badge">AI generation</span>
        <h1>Private beta in progress</h1>
        <p className="hero-description">
          We’re polishing guided prompt templates, batch queues, and smart background cleanup before opening the studio to more teams.
        </p>
      </section>

      <div className="glass-grid">
        <Card title="Request early access" description="Tell us about your creative workflow so we can prioritize upcoming beta invites.">
          <form className="form-grid">
            <label className="field-root">
              <span className="field-label">Work email</span>
              <input type="email" name="email" placeholder="you@studio.com" disabled />
              <span className="field-hint">Beta requests are paused for now. Watch your inbox for launch updates.</span>
            </label>
            <label className="field-root">
              <span className="field-label">Use cases</span>
              <textarea name="usecase" rows={4} placeholder="Concept art, marketing visuals, brand kits…" disabled />
            </label>
            <div className="form-actions">
              <button type="button" className="secondary" disabled>
                Join waitlist
              </button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  )
}
