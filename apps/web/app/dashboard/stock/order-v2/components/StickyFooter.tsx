'use client'

interface StickyFooterProps {
  selectedCount: number
  totalCost: number
  userBalance: number
  onBack: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function StickyFooter({
  selectedCount,
  totalCost,
  userBalance,
  onBack,
  onConfirm,
  isLoading = false,
}: StickyFooterProps) {
  const canProceed = selectedCount > 0 && totalCost <= userBalance
  const insufficient = totalCost > userBalance

  return (
    <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-gray-900/95 border-t border-white/20 p-6 z-50">
      <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">
            {selectedCount} {selectedCount === 1 ? 'Asset' : 'Assets'} Selected
          </h3>
          <p className="text-sm text-gray-400">
            {totalCost} pts required • {userBalance} pts available
          </p>
          {insufficient ? (
            <p className="text-sm text-red-400 font-medium mt-1">
              ⚠️ Need {totalCost - userBalance} more points
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canProceed || isLoading}
            className={`px-8 py-3 font-bold rounded-lg transition-all ${
              canProceed && !isLoading
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Processing...
              </span>
            ) : insufficient ? (
              `Need ${totalCost - userBalance} More Points`
            ) : (
              `Confirm & Download (${totalCost} pts)`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
