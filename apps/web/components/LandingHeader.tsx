'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { landingTheme } from '../styles/landingTheme'
import type { ShellMessages } from '../lib/i18n/shell'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileNavDrawer } from './MobileNavDrawer'
import { initAnalytics, trackEvent } from '../lib/analytics'

interface LandingHeaderProps {
  locale: string
  labels: ShellMessages['navigation']
  languageSwitcher: ShellMessages['languageSwitcher']
}

const navMotion = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
}

export function LandingHeader({ locale, labels, languageSwitcher }: LandingHeaderProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const avatarMenuRef = useRef<HTMLDivElement>(null)

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)

  useEffect(() => {
    initAnalytics()

    const handler = () => {
      setIsScrolled(window.scrollY > 16)
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const isActive = (href: string) => {
    if (href.startsWith('#')) {
      return typeof window !== 'undefined' && window.location.hash === href
    }
    return pathname === href
  }

  const scrollToAnchor = useCallback((href: string) => {
    if (!href.startsWith('#')) return
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', href)
    }
  }, [])

  useEffect(() => {
    if (!isAvatarOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!avatarMenuRef.current) return
      if (!avatarMenuRef.current.contains(event.target as Node)) {
        setIsAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAvatarOpen])

  const handleAnchorNavigate = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (href.startsWith('#')) {
        event.preventDefault()
        scrollToAnchor(href)
      }
      trackEvent('nav_link_clicked', {
        href,
        source: 'desktop-nav',
        locale,
      })
      scrollToAnchor(href)
      setIsMenuOpen(false)
    },
    [locale, scrollToAnchor],
  )

  const handleNavigate = useCallback(
    (href: string, event?: React.MouseEvent<HTMLElement>) => {
      if (href.startsWith('#')) {
        if (event) {
          event.preventDefault()
        }
        scrollToAnchor(href)
      }
      trackEvent('nav_link_clicked', {
        href,
        source: 'mobile-nav',
        locale,
      })
      setIsMenuOpen(false)
      setIsAvatarOpen(false)
    },
    [locale, scrollToAnchor],
  )

  const avatarInitials = useMemo(() => {
    if (!session?.user?.name) return 'PF'
    return session.user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }, [session?.user?.name])

  const avatarMenuItems = useMemo(() => labels.authLinks ?? [], [labels.authLinks])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <motion.header
      className={isScrolled ? 'landing-header landing-header--scrolled' : 'landing-header'}
      initial={navMotion.initial}
      animate={navMotion.animate}
      transition={{ duration: landingTheme.motion.durationShort, ease: landingTheme.motion.easeOut }}
    >
      <div className="landing-header__inner">
        <Link href="/" className="landing-header__brand">
          <Image src="/assets/logo.svg" alt={labels.brandAlt} width={132} height={36} priority />
        </Link>
        <nav className="landing-header__nav" aria-label={labels.ariaLabel}>
          <ul>
            {labels.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={isActive(link.href) ? 'is-active' : undefined}
                  onClick={(event) => handleAnchorNavigate(event, link.href)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="landing-header__actions">
          <LanguageSwitcher currentLocale={locale as never} labels={languageSwitcher} />
          {session?.user ? (
            <div className="landing-header__avatar" ref={avatarMenuRef}>
              <button
                type="button"
                className="landing-header__avatar-button"
                onClick={() => setIsAvatarOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isAvatarOpen}
              >
                {session.user.image ? (
                  <Image src={session.user.image} alt={session.user.name ?? 'Account'} width={36} height={36} className="landing-header__avatar-image" />
                ) : (
                  <span className="landing-header__avatar-fallback">{avatarInitials}</span>
                )}
              </button>
              {isAvatarOpen ? (
                <div className="landing-header__avatar-menu" role="menu">
                  <div className="landing-header__avatar-meta">
                    <span className="landing-header__avatar-name">{session.user.name ?? 'Account'}</span>
                    {session.user.email ? <span className="landing-header__avatar-email">{session.user.email}</span> : null}
                  </div>
                  <ul>
                    {avatarMenuItems.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} className="landing-header__avatar-link" role="menuitem" onClick={() => setIsAvatarOpen(false)}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="landing-header__signout"
                    onClick={() => {
                      trackEvent('nav_sign_out_clicked', { locale, source: 'desktop-nav' })
                      handleSignOut()
                    }}
                  >
                    {labels.signOut}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link
                href={labels.ctaSecondary.href}
                className="landing-header__cta landing-header__cta--secondary"
                onClick={() =>
                  trackEvent('nav_cta_clicked', {
                    href: labels.ctaSecondary.href,
                    label: labels.ctaSecondary.label,
                    locale,
                    variant: 'secondary',
                    source: 'desktop-nav',
                  })
                }
              >
                {labels.ctaSecondary.label}
              </Link>
              <Link
                href={labels.ctaPrimary.href}
                className="landing-header__cta landing-header__cta--primary"
                onClick={() =>
                  trackEvent('nav_cta_clicked', {
                    href: labels.ctaPrimary.href,
                    label: labels.ctaPrimary.label,
                    locale,
                    variant: 'primary',
                    source: 'desktop-nav',
                  })
                }
              >
                {labels.ctaPrimary.label}
              </Link>
            </>
          )}
          <button
            type="button"
            className="landing-header__menu"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="landing-mobile-drawer"
          >
            <span className="sr-only">{labels.toggleLabel}</span>
            <span aria-hidden>☰</span>
          </button>
        </div>
      </div>
      <MobileNavDrawer
        open={isMenuOpen}
        locale={locale}
        labels={labels}
        languageSwitcher={languageSwitcher}
        isAuthenticated={Boolean(session?.user)}
        avatarInitials={avatarInitials}
        userName={session?.user?.name}
        userEmail={session?.user?.email}
        onSignOut={handleSignOut}
        onNavigate={handleNavigate}
        onClose={() => setIsMenuOpen(false)}
      />
    </motion.header>
  )
}
