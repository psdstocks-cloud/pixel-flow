'use client'

import clsx from 'clsx'

export type OrderSummaryPanelProps = {
  selectedCount: number
  totalTasks: number
  totalSelectedPoints: number
  availablePoints: number
  remainingPoints: number
  isConfirming: boolean
  hasInsufficientPoints: boolean
  onConfirm: () => void
  onClearSelection: () => void
  disableConfirm: boolean
  disableClear: boolean
}

function SummaryContent({
  selectedCount,
  totalTasks,
  totalSelectedPoints,
  availablePoints,
  remainingPoints,
  isConfirming,
  hasInsufficientPoints,
  onConfirm,
  onClearSelection,
  disableConfirm,
  disableClear,
}: OrderSummaryPanelProps) {
  const confirmedRatio = availablePoints > 0 ? Math.min(totalSelectedPoints / availablePoints, 1) : totalSelectedPoints > 0 ? 1 : 0
  const remainingLabel = remainingPoints > 0 ? `${remainingPoints} pts remaining` : 'No points remaining'

  return (
    <div className="order-summary__content">
      <div className="order-summary__header">
        <h3 className="type-heading-m">Selection summary</h3>
        <p className="type-body-s">
          {selectedCount} of {totalTasks} previewed assets selected
        </p>
      </div>

      <div className="order-summary__stats">
        <div>
          <span className="order-summary__label type-body-s">Selected cost</span>
          <strong className="type-heading-m">{totalSelectedPoints} pts</strong>
        </div>
        <div>
          <span className="order-summary__label type-body-s">Balance</span>
          <strong className="type-heading-m">{availablePoints} pts</strong>
        </div>
      </div>

      <div className="order-summary__progress" role="status" aria-live="polite" aria-label={`Remaining balance: ${remainingLabel}`}>
        <div className="order-summary__progress-track">
          <div className="order-summary__progress-fill" style={{ width: `${confirmedRatio * 100}%` }} />
        </div>
        <span className="order-summary__progress-label type-body-s">{remainingLabel}</span>
      </div>

      {hasInsufficientPoints ? (
        <p className="order-summary__warning type-body-s" role="alert">
          You need {totalSelectedPoints - availablePoints} more points to queue these orders.
        </p>
      ) : null}

      <div className="order-summary__actions">
        <button
          type="button"
          className={clsx('primary', { disabled: disableConfirm })}
          onClick={onConfirm}
          disabled={disableConfirm}
        >
          <span className="button-content">
            {isConfirming ? <span className="button-spinner" aria-hidden="true" /> : null}
            {isConfirming ? 'Confirming…' : 'Confirm selected'}
          </span>
        </button>
        <button type="button" className="secondary" onClick={onClearSelection} disabled={disableClear}>
          Clear selection
        </button>
      </div>
    </div>
  )
}

export function OrderSummaryPanel(props: OrderSummaryPanelProps) {
  return (
    <>
      <aside className="order-summary order-summary--desktop" aria-live="polite">
        <SummaryContent {...props} />
      </aside>
      <details className="order-summary order-summary--mobile" aria-live="polite">
        <summary className="order-summary__mobile-toggle type-heading-s">
          Selection summary ({props.selectedCount})
        </summary>
        <SummaryContent {...props} />
      </details>
    </>
  )
}
