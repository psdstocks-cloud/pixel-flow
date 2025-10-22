'use client'

import clsx from 'clsx'

type Step = {
  number: number
  label: string
  icon: string
}

type StepIndicatorProps = {
  currentStep: number
  steps?: Step[]
}

const DEFAULT_STEPS: Step[] = [
  { number: 1, label: 'Paste URLs', icon: '📋' },
  { number: 2, label: 'Review Assets', icon: '🔍' },
  { number: 3, label: 'Confirm Order', icon: '✓' },
]

export function StepIndicator({ currentStep, steps = DEFAULT_STEPS }: StepIndicatorProps) {
  return (
    <div className="order-step-indicator" role="list" aria-label="Order progress">
      {steps.map((step, index) => {
        const isActive = currentStep >= step.number
        const isComplete = currentStep > step.number
        return (
          <div key={step.number} className="order-step-indicator__item" role="listitem">
            <div className="order-step-indicator__node">
              <div
                className={clsx('order-step-indicator__icon', {
                  'order-step-indicator__icon--active': isActive,
                  'order-step-indicator__icon--complete': isComplete,
                })}
                aria-current={isActive && !isComplete ? 'step' : undefined}
              >
                {isComplete ? '✓' : step.icon}
              </div>
              <span className="order-step-indicator__label">{step.label}</span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={clsx('order-step-indicator__connector', {
                  'order-step-indicator__connector--complete': currentStep > step.number,
                })}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
