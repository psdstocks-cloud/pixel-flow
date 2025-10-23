'use client';

import Image from 'next/image';
import { Order } from '../../../../../lib/api';

interface OrderCardProps {
  order: Order;
  selected?: boolean;
  onToggleSelect?: () => void;
  showCheckbox?: boolean;
}

const statusConfig = {
  PENDING: { color: 'bg-gray-500', label: 'Pending', icon: '⏳' },
  PROCESSING: { color: 'bg-yellow-500', label: 'Processing', icon: '⚙️' },
  READY: { color: 'bg-blue-500', label: 'Ready', icon: '✨' },
  DOWNLOADING: { color: 'bg-indigo-500', label: 'Downloading', icon: '📥' },
  COMPLETED: { color: 'bg-green-500', label: 'Completed', icon: '✅' },
  ERROR: { color: 'bg-red-500', label: 'Error', icon: '❌' },
  TIMEOUT: { color: 'bg-orange-500', label: 'Timeout', icon: '⏱️' },
};

export function OrderCard({ order, selected, onToggleSelect, showCheckbox }: OrderCardProps) {
  const status = statusConfig[order.status];

  return (
    <div
      className={`backdrop-blur-xl bg-white/10 rounded-xl border-2 p-6 transition-all ${
        selected
          ? 'border-purple-500 shadow-lg shadow-purple-500/20'
          : 'border-white/20 hover:border-white/30'
      }`}
    >
      <div className="flex items-start gap-4">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            disabled={order.status === 'ERROR'}
            className="mt-1 w-5 h-5 rounded cursor-pointer"
          />
        )}

        <div className="flex-shrink-0">
          <div
            className={`w-3 h-3 rounded-full ${status.color} ${
              order.status === 'PROCESSING' ? 'animate-pulse' : ''
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          {order.stockImage && (
            <img
              src={order.stockImage}
              alt={order.stockTitle || 'Stock image'}
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
          )}

          <h3 className="text-white font-semibold mb-2 truncate">
            {order.stockTitle || 'Untitled'}
          </h3>

          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <span className="text-gray-400">Source:</span>
              <span className="text-white ml-2 capitalize">{order.site}</span>
            </div>
            <div>
              <span className="text-gray-400">Cost:</span>
              <span className="text-purple-400 ml-2 font-bold">{order.cost} pts</span>
            </div>
            {order.stockAuthor && (
              <div>
                <span className="text-gray-400">Author:</span>
                <span className="text-white ml-2 truncate">{order.stockAuthor}</span>
              </div>
            )}
            {order.stockFormat && (
              <div>
                <span className="text-gray-400">Format:</span>
                <span className="text-white ml-2">{order.stockFormat}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 bg-${status.color}/20 text-white border border-${status.color}/30`}
            >
              <span>{status.icon}</span>
              <span>{status.label}</span>
            </span>

            {order.retryCount > 0 && order.status === 'PROCESSING' && (
              <span className="text-xs text-gray-400">
                Attempt {order.retryCount}/60
              </span>
            )}
          </div>

          {order.status === 'ERROR' && order.errorMessage && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-300">{order.errorMessage}</p>
            </div>
          )}

          {order.status === 'COMPLETED' && order.downloadLink && (
            <a
              href={order.downloadLink}
              download={order.fileName}
              className="mt-3 block w-full py-2 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg text-center transition-all"
            >
              Download {order.fileName}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
