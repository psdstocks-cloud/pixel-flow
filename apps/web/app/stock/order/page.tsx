import { Suspense } from 'react'
import { Card, SectionHeader } from '../../../components'

export default function StockOrderPage() {
  return (
    <main style={{ padding: '48px 56px', display: 'grid', gap: 32 }}>
      <SectionHeader
        title="Stock Order"
        subtitle="Queue and track stock asset downloads across your connected providers."
      />

      <div className="grid two-column" style={{ alignItems: 'start' }}>
        <Card
          title="Order details"
          description="Provide a URL or site + ID to begin processing your download task."
        >
          <div style={{ color: '#94a3b8' }}>
            {/* Form elements will be added here in the next step */}
            <em>Form coming soon…</em>
          </div>
        </Card>

        <Card
          title="Task status"
          description="Monitor progress, download results, and review recent activity."
        >
          <Suspense fallback={<p style={{ color: '#94a3b8' }}>Loading status…</p>}>
            <div style={{ color: '#94a3b8' }}>
              <em>Status overview coming soon…</em>
            </div>
          </Suspense>
        </Card>
      </div>
    </main>
  )
}
