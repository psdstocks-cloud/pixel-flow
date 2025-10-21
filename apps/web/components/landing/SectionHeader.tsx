'use client'

import type { ReactNode } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { landingTheme } from '../../styles/landingTheme'
import { IconBadge } from './IconBadge'

interface LandingSectionHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'start' | 'center'
  actionSlot?: ReactNode
  invert?: boolean
  icon?: ReactNode
  size?: 'display-xl' | 'display-l' | 'display-m' | 'heading-xl' | 'heading-l' | 'heading-m'
}

export function LandingSectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'start',
  actionSlot,
  invert = false,
  icon,
  size = 'heading-xl',
}: LandingSectionHeaderProps) {
  const headingClass = clsx('landing-section-header__title', {
    'type-display-xl': size === 'display-xl',
    'type-display-l': size === 'display-l',
    'type-display-m': size === 'display-m',
    'type-heading-xl': size === 'heading-xl',
    'type-heading-l': size === 'heading-l',
    'type-heading-m': size === 'heading-m',
  })

  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: landingTheme.motion.duration, ease: landingTheme.motion.easeOut }}
      viewport={{ once: true, amount: 0.4 }}
      className={clsx('landing-section-header', {
        'landing-section-header--center': align === 'center',
        'landing-section-header--invert': invert,
      })}
    >
      <div className="landing-section-header__copy">
        {icon ? <IconBadge icon={icon} tone={invert ? 'highlight' : 'primary'} /> : null}
        {eyebrow ? <p className="landing-section-header__eyebrow type-eyebrow">{eyebrow}</p> : null}
        {title ? <h2 className={headingClass}>{title}</h2> : null}
        {subtitle ? <p className="landing-section-header__subtitle type-body-l">{subtitle}</p> : null}
      </div>
      {actionSlot ? <div className="landing-section-header__actions">{actionSlot}</div> : null}
    </motion.header>
  )
}
