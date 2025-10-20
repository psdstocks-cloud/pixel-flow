'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { landingTheme } from '../../styles/landingTheme'

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqAccordionProps {
  items: FaqItem[]
  headline?: string
  onItemToggle?: (index: number, isOpen: boolean) => void
}

export function FaqAccordion({ items, onItemToggle }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(items.length ? 0 : null)

  useEffect(() => {
    setOpenIndex((prev) => {
      if (items.length === 0) {
        return null
      }
      if (prev === null || prev >= items.length) {
        return 0
      }
      return prev
    })
  }, [items])

  const toggleItem = (index: number) => {
    const nextIndex = index === openIndex ? null : index
    setOpenIndex(nextIndex)
    onItemToggle?.(index, nextIndex === index)
  }

  return (
    <div className="faq-accordion" role="region">
      {items.map((item, index) => {
        const isOpen = index === openIndex
        return (
          <div key={item.question} className={clsx('faq-accordion__item', { 'faq-accordion__item--open': isOpen })}>
            <button type="button" className="faq-accordion__trigger" aria-expanded={isOpen} onClick={() => toggleItem(index)}>
              <span>{item.question}</span>
              <span aria-hidden>{isOpen ? '−' : '+'}</span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="content"
                  className="faq-accordion__content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: landingTheme.motion.duration, ease: landingTheme.motion.easeOut }}
                >
                  <p>{item.answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
