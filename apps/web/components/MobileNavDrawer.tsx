'use client'

import { useEffect, useRef, type MouseEvent } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import type { ShellMessages } from '../lib/i18n/shell'
import { LanguageSwitcher } from './LanguageSwitcher'
import { trackEvent } from '../lib/analytics'

interface MobileNavDrawerProps {
  open: boolean
  locale: string
  labels: ShellMessages['navigation']
  languageSwitcher: ShellMessages['languageSwitcher']
  isAuthenticated: boolean
  avatarInitials: string
  userName?: string | null
  userEmail?: string | null
  onSignOut: () => void
  onNavigate: (href: string, event?: MouseEvent<HTMLElement>) => void
  onClose: () => void
}

const drawerMotion = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export function MobileNavDrawer({
  open,
  locale,
  labels,
  languageSwitcher,
  isAuthenticated,
  avatarInitials,
  userName,
  userEmail,
  onSignOut,
  onNavigate,
  onClose,
}: MobileNavDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const drawer = drawerRef.current
    if (!drawer) return
    const focusable = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    focusable[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={overlayRef}
          className="landing-header__drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="presentation"
          onClick={onClose}
        >
          <motion.div
            ref={drawerRef}
            id="landing-mobile-drawer"
            className="landing-header__drawer"
            role="dialog"
            aria-modal="true"
            initial={drawerMotion.hidden}
            animate={drawerMotion.visible}
            exit={drawerMotion.exit}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="landing-header__drawer-top">
              <span className="landing-header__drawer-title">{labels.menuLabel}</span>
              <button type="button" className="landing-header__drawer-close" onClick={onClose}>
                <span className="sr-only">{labels.closeLabel}</span>
                ×
              </button>
            </div>
            <LanguageSwitcher currentLocale={locale as never} labels={languageSwitcher} />
            <nav className="landing-header__drawer-nav" aria-label={labels.ariaLabel}>
              <ul>
                {labels.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        onClick={(event) => {
                          trackEvent('nav_link_clicked', {
                            href: link.href,
                            source: 'mobile-nav',
                            locale,
                          })
                          onNavigate(link.href, event)
                        }}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={(event) => {
                          trackEvent('nav_link_clicked', {
                            href: link.href,
                            source: 'mobile-nav',
                            locale,
                          })
                          onNavigate(link.href, event as unknown as MouseEvent<HTMLElement>)
                        }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="landing-header__drawer-actions">
              {isAuthenticated ? (
                <>
                  <div className="landing-header__drawer-user">
                    <div className="landing-header__drawer-avatar">{avatarInitials}</div>
                    <div>
                      <p>{userName ?? 'Account'}</p>
                      {userEmail ? <span>{userEmail}</span> : null}
                    </div>
                  </div>
                  {(labels.authLinks ?? []).map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => {
                      trackEvent('nav_link_clicked', {
                        href: item.href,
                        source: 'mobile-nav',
                        locale,
                      })
                      onNavigate(item.href)
                    }}>
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    className="landing-header__drawer-signout"
                    onClick={() => {
                      trackEvent('nav_sign_out_clicked', { locale, source: 'mobile-nav' })
                      onSignOut()
                      onClose()
                    }}
                  >
                    {labels.signOut}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={labels.ctaPrimary.href}
                    className="landing-header__drawer-cta landing-header__drawer-cta--primary"
                    onClick={(event) => {
                      trackEvent('nav_cta_clicked', {
                        href: labels.ctaPrimary.href,
                        label: labels.ctaPrimary.label,
                        locale,
                        variant: 'primary',
                        source: 'mobile-nav',
                      })
                      onNavigate(labels.ctaPrimary.href, event as unknown as MouseEvent<HTMLElement>)
                    }}
                  >
                    {labels.ctaPrimary.label}
                  </Link>
                  <Link
                    href={labels.ctaSecondary.href}
                    className="landing-header__drawer-cta landing-header__drawer-cta--secondary"
                    onClick={(event) => {
                      trackEvent('nav_cta_clicked', {
                        href: labels.ctaSecondary.href,
                        label: labels.ctaSecondary.label,
                        locale,
                        variant: 'secondary',
                        source: 'mobile-nav',
                      })
                      onNavigate(labels.ctaSecondary.href, event)
                    }}
                  >
                    {labels.ctaSecondary.label}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
