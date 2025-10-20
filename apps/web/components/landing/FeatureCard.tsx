'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { landingTheme } from '../../styles/landingTheme'

export interface FeatureCardProps {
  id: string
  icon?: ReactNode
  title: string
  description: string
  pricing?: string
  ctaLabel?: string
  href?: string
  onClick?: () => void
  illustrationSlot?: ReactNode
  active?: boolean
}

export function FeatureCard({ id, icon, title, description, pricing, ctaLabel, href, onClick, illustrationSlot, active }: FeatureCardProps) {
  const content = (
    <div className="feature-card__inner">
      <div className="feature-card__icon" aria-hidden>
        {illustrationSlot ?? icon}
      </div>
      <div className="feature-card__content">
        {pricing ? <span className="feature-card__pricing">{pricing}</span> : null}
        <h3 className="feature-card__title">{title}</h3>
        <p className="feature-card__description">{description}</p>
      </div>
      {ctaLabel ? <span className="feature-card__cta-label">{ctaLabel}</span> : null}
    </div>
  )

  return (
    <motion.article
      layout
      key={id}
      className={clsx('feature-card', { 'feature-card--active': active })}
      whileHover={{ translateY: -6 }}
      transition={{ duration: landingTheme.motion.durationShort, ease: landingTheme.motion.easeOut }}
    >
      {href ? (
        <Link href={href} className="feature-card__link" onClick={onClick}>
          {content}
        </Link>
      ) : (
        <button type="button" className="feature-card__button" onClick={onClick}>
          {content}
        </button>
      )}
    </motion.article>
  )
}
