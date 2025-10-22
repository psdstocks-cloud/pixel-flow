'use client'

export function EmptySearchState() {
  return (
    <div className="order-empty-state" role="status" aria-live="polite">
      <div className="order-empty-state__illustration" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="order-empty-state__icon">
          <g fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M28 16a12 12 0 1 1 0 24 12 12 0 0 1 0-24Z" />
            <path d="m39 39 9 9" />
            <path d="M24 30h8" />
            <path d="M24 24h12" />
          </g>
        </svg>
      </div>
      <h3 className="order-empty-state__title">Ready to search</h3>
      <p className="order-empty-state__description">
        Paste up to 5 stock URLs and select <strong>Process batch</strong> to preview assets, pricing, and download options.
      </p>
      <div className="order-empty-state__tip">
        <span aria-hidden="true">💡</span>
        <span>Tip: You can review assets before spending points.</span>
      </div>
    </div>
  )
}
