'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { landingTheme } from '../../styles/landingTheme'

export interface Testimonial {
  quote: string
  author: string
  role?: string
  company?: string
  avatarUrl?: string
  logo?: ReactNode
  rating?: number
}

export interface TestimonialCarouselProps {
  testimonials: Testimonial[]
  autoAdvance?: boolean
  intervalMs?: number
}

export function TestimonialCarousel({ testimonials, autoAdvance = true, intervalMs = 8000 }: TestimonialCarouselProps) {
  const safeTestimonials = useMemo(() => testimonials.filter(Boolean), [testimonials])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!autoAdvance || safeTestimonials.length <= 1) {
      return undefined
    }

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeTestimonials.length)
    }, intervalMs)

    return () => clearInterval(timer)
  }, [autoAdvance, intervalMs, safeTestimonials.length])

  useEffect(() => {
    if (index >= safeTestimonials.length) {
      setIndex(0)
    }
  }, [index, safeTestimonials.length])

  const active = safeTestimonials[index]

  if (!active) {
    return null
  }

  return (
    <section className="testimonial-carousel" aria-roledescription="carousel">
      <div className="testimonial-carousel__viewport">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={active.quote}
            className="testimonial-carousel__slide"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: landingTheme.motion.duration, ease: landingTheme.motion.easeOut }}
          >
            <p className="testimonial-carousel__quote">“{active.quote}”</p>
            <footer className="testimonial-carousel__meta">
              <div>
                <strong>{active.author}</strong>
                {active.role ? <span>{active.role}</span> : null}
                {active.company ? <span>{active.company}</span> : null}
              </div>
              {active.logo ?? null}
            </footer>
          </motion.blockquote>
        </AnimatePresence>
      </div>
      <div className="testimonial-carousel__controls" role="tablist">
        {safeTestimonials.map((item, itemIndex) => (
          <button
            key={`${item.author}-${itemIndex}`}
            type="button"
            role="tab"
            aria-selected={itemIndex === index}
            className={clsx('testimonial-carousel__dot', { 'testimonial-carousel__dot--active': itemIndex === index })}
            onClick={() => setIndex(itemIndex)}
          >
            <span className="sr-only">{item.author}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
