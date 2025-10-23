'use client'

import Image from 'next/image'
import { Order } from '@/lib/api'

interface OrderCardProps {
  order: Order
  selected?: boolean
  onToggleSelect?: () => void
  showCheckbox?: boolean
}

const statusConfig: Record<
  Order['status'],
  { color: string; label: string; icon: string; badgeClasses: string; pulse?: boolean }
> = {
  PENDING: {
    color: 'bg-gray-500',
    label: 'Pending',
    icon: '⏳',
    badgeClasses: 'bg-white/10 text-gray-200 border border-white/20',
  },
  PROCESSING: {
    color: 'bg-yellow-500',
    label: 'Processing',
    icon: '⚙️',
    badgeClasses: 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30',
    pulse: true,
  },
  READY: {
    color: 'bg-blue-500',
    label: 'Ready',
    icon: '✨',
    badgeClasses: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
  },
  DOWNLOADING: {
    color: 'bg-indigo-500',
    label: 'Downloading',
    icon: '📥',
    badgeClasses: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30',
    pulse: true,
  },
  COMPLETED: {
    color: 'bg-green-500',
    label: 'Completed',
    icon: '✅',
    badgeClasses: 'bg-green-500/20 text-green-200 border border-green-500/30',
  },
  ERROR: {
    color: 'bg-red-500',
    label: 'Error',
    icon: '❌',
    badgeClasses: 'bg-red-500/20 text-red-200 border border-red-500/30',
  },
  TIMEOUT: {
    color: 'bg-orange-500',
    label: 'Timeout',
    icon: '⏱️',
    badgeClasses: 'bg-orange-500/20 text-orange-200 border border-orange-500/30',
  },
}

export function OrderCard({ order, selected, onToggleSelect, showCheckbox }: OrderCardProps) {
  const status = statusConfig[order.status]

  return (
    <div
      className={`backdrop-blur-xl bg-white/10 rounded-xl border-2 p-6 transition-all ${
        selected ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-white/20 hover:border-white/30'
      }`}
    >
      <div className="flex items-start gap-4">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            disabled={order.status === 'ERROR' || order.status === 'TIMEOUT'}
            className="mt-1 w-5 h-5 rounded border border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
          />
        )}

        <div className="flex-shrink-0">
          <div
            className={`w-3 h-3 rounded-full ${status.color} ${status.pulse ? 'animate-pulse' : ''}`}
            aria-hidden="true"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {order.stockImage ? (
            <div className="relative h-32 w-full overflow-hidden rounded-lg">
              <Image
                src={order.stockImage}
                alt={order.stockTitle || 'Stock image'}
                fill
                sizes="100vw"
                className="object-cover"
                priority={false}
              />
            </div>
          ) : null}

          <div>
            <h3 className="text-white font-semibold mb-1 truncate">{order.stockTitle || 'Untitled Asset'}</h3>
            <p className="text-sm text-gray-400 truncate">{order.stockUrl}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Source:</span>
              <span className="text-white ml-2 capitalize">{order.site}</span>
            </div>
            <div>
              <span className="text-gray-400">Cost:</span>
              <span className="text-purple-400 ml-2 font-bold">{order.cost} pts</span>
            </div>
            {order.stockAuthor ? (
              <div>
                <span className="text-gray-400">Author:</span>
                <span className="text-white ml-2 truncate">{order.stockAuthor}</span>
              </div>
            ) : null}
            {order.stockFormat ? (
              <div>
                <span className="text-gray-400">Format:</span>
                <span className="text-white ml-2 uppercase">{order.stockFormat}</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${status.badgeClasses}`}>
              <span>{status.icon}</span>
              <span>{status.label}</span>
            </span>

            {order.retryCount > 0 && ['PROCESSING', 'READY', 'DOWNLOADING'].includes(order.status) ? (
              <span className="text-xs text-gray-400">Attempt {order.retryCount}/60</span>
            ) : null}
          </div>

          {order.status === 'ERROR' && order.errorMessage ? (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-300">{order.errorMessage}</p>
            </div>
          ) : null}

          {order.status === 'COMPLETED' && order.downloadLink ? (
            <a
              href={order.downloadLink}
              download={order.fileName || undefined}
              className="block w-full py-2 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg text-center transition-all"
            >
              Download {order.fileName || ''}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
