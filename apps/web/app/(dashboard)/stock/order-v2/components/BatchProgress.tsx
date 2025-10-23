'use client'

interface BatchProgressProps {
  total: number
  completed: number
  processing: number
  failed: number
}

export function BatchProgress({ total, completed, processing, failed }: BatchProgressProps) {
  const safeTotal = Math.max(total, 1)
  const completedPercent = (completed / safeTotal) * 100
  const processingPercent = (processing / safeTotal) * 100
  const failedPercent = (failed / safeTotal) * 100

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Batch Progress</h3>

      <div className="relative w-full h-4 bg-white/5 rounded-full overflow-hidden mb-4">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-500"
          style={{ width: `${completedPercent}%` }}
        />
        <div
          className="absolute top-0 h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
          style={{ left: `${completedPercent}%`, width: `${processingPercent}%` }}
        />
        <div
          className="absolute top-0 h-full bg-gradient-to-r from-red-600 to-red-700 transition-all duration-500"
          style={{ left: `${completedPercent + processingPercent}%`, width: `${failedPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-400">{completed}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-400">{processing}</div>
          <div className="text-xs text-gray-400">Processing</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-400">{failed}</div>
          <div className="text-xs text-gray-400">Failed</div>
        </div>
      </div>

      {processing > 0 ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 text-sm">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full" />
          <span>Processing {processing} {processing === 1 ? 'order' : 'orders'}...</span>
        </div>
      ) : null}

      {processing === 0 && failed === 0 && completed === total && total > 0 ? (
        <div className="mt-4 text-center text-green-400 text-sm font-medium">
          🎉 All orders completed successfully!
        </div>
      ) : null}

      {failed > 0 ? (
        <div className="mt-4 text-center text-red-400 text-sm">
          ⚠️ {failed} {failed === 1 ? 'order' : 'orders'} failed
        </div>
      ) : null}
    </div>
  )
}
