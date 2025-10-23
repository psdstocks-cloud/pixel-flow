'use client'

interface DeliverySelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const deliveryOptions = [
  {
    value: 'any',
    label: 'Auto-Select',
    description: 'Fastest available server',
    icon: '🚀',
  },
  {
    value: 'gdrive',
    label: 'Google Drive',
    description: 'Temporary download link',
    icon: '☁️',
  },
  {
    value: 'mydrivelink',
    label: 'My Drive',
    description: 'Saved to your Drive',
    icon: '💾',
  },
  {
    value: 'asia',
    label: 'Asia Server',
    description: 'Optimized for Asia',
    icon: '🌏',
  },
] as const

export function DeliverySelector({ value, onChange, disabled = false }: DeliverySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-white font-semibold text-lg">Delivery Method</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {deliveryOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`p-4 rounded-xl border-2 transition-all text-left group hover:scale-105 ${
              value === option.value
                ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20'
                : 'bg-white/5 border-white/10 hover:border-white/30'
            } ${disabled ? 'opacity-60 cursor-not-allowed hover:scale-100' : ''}`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{option.icon}</span>
              {value === option.value && <span className="text-purple-400 text-xl">✓</span>}
            </div>
            <div className="font-medium text-white mb-1">{option.label}</div>
            <p className="text-xs text-gray-400">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
