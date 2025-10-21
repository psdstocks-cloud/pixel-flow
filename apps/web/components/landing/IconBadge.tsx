'use client'

import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface IconBadgeProps {
  icon: ReactNode
  label?: string
  tone?: 'primary' | 'highlight' | 'muted'
  size?: 'sm' | 'md'
  className?: string
}

export function IconBadge({ icon, label, tone = 'primary', size = 'md', className }: IconBadgeProps) {
  return (
    <span
      className={clsx('icon-badge', {
        'icon-badge--highlight': tone === 'highlight',
        'icon-badge--muted': tone === 'muted',
        'icon-badge--sm': size === 'sm',
      }, className)}
    >
      <span className="icon-badge__icon" aria-hidden>
        {icon}
      </span>
      {label ? <span className="icon-badge__label type-eyebrow">{label}</span> : null}
    </span>
  )
}
