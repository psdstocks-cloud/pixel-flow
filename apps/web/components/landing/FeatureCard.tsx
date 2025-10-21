'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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
  variant?: 'primary' | 'secondary'
}

export function FeatureCard({
  id,
  icon,
  title,
  description,
  pricing,
  ctaLabel,
  href,
  onClick,
  illustrationSlot,
  active,
  variant = 'secondary',
}: FeatureCardProps) {
  const cardClassName = clsx('feature-card', {
    'feature-card--active': active,
    'feature-card--primary': variant === 'primary',
    'feature-card--secondary': variant === 'secondary',
  })

  const content = (
    <div className="feature-card__inner">
      <div
        className={clsx('feature-card__icon-ring', {
          'feature-card__icon-ring--highlight': variant === 'primary',
        })}
        aria-hidden
      >
        {illustrationSlot ?? icon}
      </div>
      <div className="feature-card__content">
        {pricing ? <span className="feature-card__pricing type-eyebrow">{pricing}</span> : null}
        <h3 className="feature-card__title type-heading-m">{title}</h3>
        <p className="feature-card__description type-body-m">{description}</p>
      </div>
      {ctaLabel ? (
        <span className="feature-card__cta-label">
          {ctaLabel}
          <ArrowRight size={16} aria-hidden />
        </span>
      ) : null}
    </div>
  )

  return (
    <motion.article
      layout
      key={id}
      className={cardClassName}
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
