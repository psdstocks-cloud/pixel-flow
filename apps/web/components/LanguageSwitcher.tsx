'use client'

import { useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { setLocale } from '../lib/i18n/actions'
import { SUPPORTED_LOCALES, type Locale } from '../lib/i18n-config'

export function LanguageSwitcher({
  currentLocale,
  labels,
}: {
  currentLocale: Locale
  labels: {
    label: string
    loading: string
    options: Record<Locale, string>
  }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value
    if (!SUPPORTED_LOCALES.includes(nextLocale as Locale)) return

    startTransition(async () => {
      await setLocale(nextLocale as Locale)
      const query = searchParams?.toString()
      const url = query ? `${pathname}?${query}` : pathname
      router.replace(url, { scroll: false })
      router.refresh()
    })
  }

  return (
    <div className="locale-switcher" aria-live="polite" data-pending={isPending}
      >
      <label className="locale-label" htmlFor="language-select">
        {labels.label}
      </label>
      <div className="locale-select-wrapper">
        <select
          id="language-select"
          value={currentLocale}
          onChange={handleChange}
          disabled={isPending}
          aria-busy={isPending}
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {labels.options[locale]}
            </option>
          ))}
        </select>
        {isPending ? (
          <span className="locale-status" role="status">
            <span className="locale-spinner" aria-hidden="true" />
            {labels.loading}
          </span>
        ) : null}
      </div>
    </div>
  )
}
