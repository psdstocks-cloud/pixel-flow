'use client'

type DeliveryType = {
  value: string
  label: string
  description: string
}

type DeliveryTypeSelectorProps = {
  selected: string
  options?: DeliveryType[]
  onChange: (value: string) => void
  disabled?: boolean
}

const DEFAULT_OPTIONS: DeliveryType[] = [
  { value: 'any', label: 'Auto-select', description: 'Fastest available delivery method' },
  { value: 'gdrive', label: 'Google Drive', description: 'Direct Google Drive link' },
  { value: 'mydrivelink', label: 'Direct download', description: 'Immediate download link' },
  { value: 'asia', label: 'Asia server', description: 'Optimized routing for Asia region' },
]

export function DeliveryTypeSelector({ selected, options = DEFAULT_OPTIONS, onChange, disabled = false }: DeliveryTypeSelectorProps) {
  return (
    <fieldset className="order-delivery-selector" disabled={disabled}>
      <legend className="order-delivery-selector__legend">Delivery method</legend>
      <div className="order-delivery-selector__grid">
        {options.map((option) => {
          const isSelected = option.value === selected
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`order-delivery-selector__option${isSelected ? ' order-delivery-selector__option--active' : ''}`}
              aria-pressed={isSelected}
            >
              <div className="order-delivery-selector__option-header">
                <span className="order-delivery-selector__option-label">{option.label}</span>
                {isSelected ? <span className="order-delivery-selector__option-icon">✓</span> : null}
              </div>
              <p className="order-delivery-selector__option-description">{option.description}</p>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
