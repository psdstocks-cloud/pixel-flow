'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { HomeMessages } from '../../lib/i18n/home'
import { landingTheme } from '../../styles/landingTheme'
import { LandingSectionHeader } from './SectionHeader'
import { FeatureCard } from './FeatureCard'
import { PricingCard } from './PricingCard'
import { TestimonialCarousel } from './TestimonialCarousel'
import { FaqAccordion } from './FaqAccordion'

interface LandingPageContentProps {
  messages: HomeMessages
  direction: 'ltr' | 'rtl'
}

export function LandingPageContent({ messages, direction }: LandingPageContentProps) {
  const { hero, heroGrid, problemSolution, features, howItWorks, pricingPreview, socialProof, faqPreview, finalCta } = messages

  const tabAllLabel = features.tabAll ?? 'All'
  const featureTabs = useMemo(
    () => [
      { id: 'all', label: tabAllLabel },
      ...features.items.map((item) => ({ id: item.id, label: item.title })),
    ],
    [features.items, tabAllLabel],
  )
  const [activeFeatureTab, setActiveFeatureTab] = useState(featureTabs[0]?.id ?? 'all')

  const filteredFeatures = useMemo(() => {
    if (activeFeatureTab === 'all') {
      return features.items
    }
    return features.items.filter((item) => item.id === activeFeatureTab)
  }, [activeFeatureTab, features.items])

  const trustIndicators = hero.trustIndicators ?? []
  const trustTickerItems = [...trustIndicators, ...trustIndicators]

  return (
    <div className="landing-page">
      <section className="landing-hero" id="hero">
        <div className="landing-hero__copy">
          {hero.badge ? <span className="landing-hero__badge">{hero.badge}</span> : null}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: landingTheme.motion.duration }}>
            {hero.headline}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: landingTheme.motion.duration, delay: 0.08 }}>
            {hero.subheadline}
          </motion.p>
          <motion.div
            className="landing-hero__actions"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: landingTheme.motion.duration, delay: 0.16 }}
          >
            <Link href="/signup" className="landing-hero__cta landing-hero__cta--primary">
              {hero.primaryCta.label}
              {hero.primaryCta.note ? <span>{hero.primaryCta.note}</span> : null}
            </Link>
            <Link href="/login" className="landing-hero__cta landing-hero__cta--secondary">
              {hero.secondaryCta.label}
              {hero.secondaryCta.note ? <span>{hero.secondaryCta.note}</span> : null}
            </Link>
          </motion.div>
          {trustIndicators.length ? (
            <div className="landing-hero__ticker" dir={direction}>
              <motion.div
                className="landing-hero__ticker-inner"
                animate={{ x: direction === 'rtl' ? ['0%', '50%'] : ['0%', '-50%'] }}
                transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
              >
                {trustTickerItems.map((item, index) => (
                  <span key={`${item}-${index}`} className="landing-hero__ticker-item">
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>
          ) : null}
        </div>
        {hero.media?.videoUrl ? (
          <motion.div className="landing-hero__media" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: landingTheme.motion.duration }}>
            <video
              className="landing-hero__video"
              src={hero.media.videoUrl}
              poster={hero.media.posterUrl ?? undefined}
              playsInline
              muted
              autoPlay
              loop
              controls
              aria-label={hero.media.alt}
            />
          </motion.div>
        ) : null}
      </section>

      <section className="landing-hero-grid" id="overview">
        {heroGrid.items.map((item) => (
          <motion.article key={item.title} className="landing-hero-grid__item" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: landingTheme.motion.duration }}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </motion.article>
        ))}
      </section>

      <section className="landing-problem-solution" id="problems">
        <LandingSectionHeader title={problemSolution.headline} align="center" />
        <div className="landing-problem-solution__track" dir={direction}>
          {problemSolution.items.map((item, index) => (
            <motion.div key={item.problem} className="landing-problem-solution__card" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: landingTheme.motion.duration, delay: index * 0.06 }}>
              <div className="landing-problem-solution__step">{index + 1}</div>
              <p className="landing-problem-solution__problem">{item.problem}</p>
              <p className="landing-problem-solution__solution">{item.solution}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="landing-features" id="features">
        <LandingSectionHeader title={features.headline} align="center" />
        <div className="landing-features__tabs" role="tablist">
          {featureTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeFeatureTab === tab.id}
              onClick={() => setActiveFeatureTab(tab.id)}
              className={activeFeatureTab === tab.id ? 'landing-features__tab landing-features__tab--active' : 'landing-features__tab'}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="landing-features__grid">
          {filteredFeatures.map((feature) => (
            <FeatureCard
              key={feature.id}
              id={feature.id}
              title={feature.title}
              description={feature.description}
              pricing={feature.pricing}
              ctaLabel={feature.cta}
              illustrationSlot={feature.icon ? <span className="landing-features__emoji" aria-hidden>{feature.icon}</span> : undefined}
            />
          ))}
        </div>
      </section>

      <section className="landing-how-it-works" id="how-it-works">
        <LandingSectionHeader title={howItWorks.headline} align="center" />
        <div className="landing-how-it-works__body">
          <ol className="landing-how-it-works__timeline">
            {howItWorks.steps.map((step) => (
              <motion.li key={step.number} initial={{ opacity: 0, x: direction === 'rtl' ? 32 : -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: landingTheme.motion.duration }}>
                <span>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </motion.li>
            ))}
          </ol>
          {howItWorks.videoUrl ? (
            <div className="landing-how-it-works__video">
              <video
                src={howItWorks.videoUrl}
                poster={hero.media?.posterUrl ?? undefined}
                controls
                playsInline
                muted
                className="landing-how-it-works__video-element"
              />
              {howItWorks.videoCaption ? <p className="landing-how-it-works__caption">{howItWorks.videoCaption}</p> : null}
            </div>
          ) : null}
        </div>
        <Link href="/signup" className="landing-how-it-works__cta">
          {howItWorks.cta}
        </Link>
      </section>

      <section className="landing-pricing" id="pricing">
        <LandingSectionHeader title={pricingPreview.headline} subtitle={pricingPreview.subheadline} align="center" />
        <div className="landing-pricing__grid">
          {pricingPreview.packages.map((pkg) => (
            <PricingCard
              key={pkg.name}
              name={pkg.name}
              credits={pkg.credits}
              price={pkg.price}
              strikePrice={pkg.strikePrice}
              savings={pkg.savings}
              notes={pkg.notes}
              ctaLabel={pkg.cta}
              badge={pkg.badge}
              recommended={pkg.badge === 'Most Popular'}
            />
          ))}
        </div>
        <p className="landing-pricing__note">{pricingPreview.note}</p>
        <Link href="/pricing" className="landing-pricing__link">
          {pricingPreview.linkText}
        </Link>
      </section>

      <section className="landing-testimonials" id="testimonials">
        <LandingSectionHeader title={socialProof.headline} align="center" />
        <TestimonialCarousel testimonials={socialProof.testimonials} />
      </section>

      <section className="landing-faq" id="faq">
        <LandingSectionHeader title={faqPreview.headline} align="center" />
        <FaqAccordion items={faqPreview.items} />
        <Link href="/faq" className="landing-faq__link">
          {faqPreview.linkText}
        </Link>
      </section>

      <section className="landing-final-cta">
        <div className="landing-final-cta__content">
          <h2>{finalCta.headline}</h2>
          <p>{finalCta.subheadline}</p>
          <Link href="/signup" className="landing-final-cta__button">
            {finalCta.cta.label}
          </Link>
          {finalCta.trustBadges?.length ? (
            <ul className="landing-final-cta__badges">
              {finalCta.trustBadges.map((badge) => (
                <li key={badge}>{badge}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  )
}
