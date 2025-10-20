'use client'

import type { ReactNode } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { landingTheme } from '../../styles/landingTheme'

export interface PricingCardProps {
  name: string
  credits: string
  price: string
  strikePrice?: string
  savings?: string
  notes: string[]
  ctaLabel: string
  badge?: string
  recommended?: boolean
  footerSlot?: ReactNode
  onSelect?: () => void
}

export function PricingCard({
  name,
  credits,
  price,
  strikePrice,
  savings,
  notes,
  ctaLabel,
  badge,
  recommended,
  footerSlot,
  onSelect,
}: PricingCardProps) {
  return (
    <motion.article
      layout
      whileHover={{ translateY: -8 }}
      transition={{ duration: landingTheme.motion.durationShort, ease: landingTheme.motion.easeOut }}
      className={clsx('pricing-card', { 'pricing-card--recommended': recommended })}
    >
      {badge ? <span className="pricing-card__badge">{badge}</span> : null}
      <header className="pricing-card__header">
        <h3>{name}</h3>
        <p className="pricing-card__credits">{credits}</p>
      </header>
      <div className="pricing-card__price">
        <div className="pricing-card__amount">
          {strikePrice ? <span className="pricing-card__strike">{strikePrice}</span> : null}
          <span className="pricing-card__value">{price}</span>
        </div>
        {savings ? <span className="pricing-card__savings">{savings}</span> : null}
      </div>
      <ul className="pricing-card__list">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <button type="button" className="pricing-card__cta" onClick={onSelect}>
        {ctaLabel}
      </button>
      {footerSlot ? <div className="pricing-card__footer">{footerSlot}</div> : null}
    </motion.article>
  )
}
