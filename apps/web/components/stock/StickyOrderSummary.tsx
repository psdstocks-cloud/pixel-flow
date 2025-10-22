'use client'

import clsx from 'clsx'

type StickyOrderSummaryProps = {
  selectedCount: number
  totalCost: number
  availablePoints: number
  isConfirming?: boolean
  onConfirm: () => void
  onClear: () => void
  disabled?: boolean
}

export function StickyOrderSummary({
  selectedCount,
  totalCost,
  availablePoints,
  isConfirming = false,
  onConfirm,
  onClear,
  disabled = false,
}: StickyOrderSummaryProps) {
  const canAfford = availablePoints >= totalCost
  const progress = availablePoints > 0 ? Math.min(totalCost / availablePoints, 1) : totalCost > 0 ? 1 : 0
  const shortfall = Math.max(totalCost - availablePoints, 0)

  return (
    <div className="order-summary-bar" role="region" aria-live="polite">
      <div className="order-summary-bar__content">
        <div className="order-summary-bar__details">
          <h3 className="order-summary-bar__title">
            {selectedCount} {selectedCount === 1 ? 'asset' : 'assets'} selected
          </h3>
          <p className="order-summary-bar__subtitle">
            {totalCost} pts required • {availablePoints} pts available
          </p>
        </div>

        <div className="order-summary-bar__actions">
          <button type="button" className="order-summary-bar__clear" onClick={onClear} disabled={disabled || selectedCount === 0}>
            Clear selection
          </button>
          <button
            type="button"
            className={clsx('order-summary-bar__confirm', {
              'order-summary-bar__confirm--disabled': disabled || selectedCount === 0 || !canAfford,
            })}
            onClick={onConfirm}
            disabled={disabled || selectedCount === 0 || !canAfford}
          >
            {isConfirming ? 'Confirming…' : canAfford ? 'Confirm & download' : `Need ${shortfall} more pts`}
          </button>
        </div>
      </div>

      <div className="order-summary-bar__progress" aria-hidden="true">
        <div className={clsx('order-summary-bar__progress-fill', { 'order-summary-bar__progress-fill--warning': !canAfford })} style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}
