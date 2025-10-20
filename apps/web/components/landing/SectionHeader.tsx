'use client'

import type { ReactNode } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { landingTheme } from '../../styles/landingTheme'

interface LandingSectionHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'start' | 'center'
  actionSlot?: ReactNode
  invert?: boolean
}

export function LandingSectionHeader({ eyebrow, title, subtitle, align = 'start', actionSlot, invert = false }: LandingSectionHeaderProps) {
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
        {eyebrow ? <p className="landing-section-header__eyebrow">{eyebrow}</p> : null}
        {title ? <h2 className="landing-section-header__title">{title}</h2> : null}
        {subtitle ? <p className="landing-section-header__subtitle">{subtitle}</p> : null}
      </div>
      {actionSlot ? <div className="landing-section-header__actions">{actionSlot}</div> : null}
    </motion.header>
  )
}
