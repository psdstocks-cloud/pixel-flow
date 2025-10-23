'use client'

interface Step {
  number: number
  label: string
  icon: string
}

interface StepIndicatorProps {
  currentStep: number
}

const steps: Step[] = [
  { number: 1, label: 'Paste URLs', icon: '📋' },
  { number: 2, label: 'Review Assets', icon: '🔍' },
  { number: 3, label: 'Download', icon: '⬇️' },
]

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                currentStep >= step.number
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-110'
                  : 'bg-white/10 text-gray-400'
              }`}
            >
              {currentStep > step.number ? '✓' : step.icon}
            </div>
            <span className="mt-2 text-sm text-gray-300 font-medium">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-16 h-1 mx-2 transition-all duration-300 ${
                currentStep > step.number
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-white/10'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
