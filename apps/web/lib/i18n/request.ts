import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, isSupportedLocale } from '../i18n-config'

const RTL_LOCALES = new Set<Locale>(['ar'])

export function getRequestLocale(): Locale {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value
  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale
  }

  const acceptLanguage = headers().get('accept-language')
  if (acceptLanguage) {
    const locales = acceptLanguage
      .split(',')
      .map((value) => value.split(';')[0]?.trim())
      .filter(Boolean) as string[]

    const negotiated = locales.find((candidate) => isSupportedLocale(candidate))
    if (negotiated) {
      return negotiated
    }
  }

  return DEFAULT_LOCALE
}

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr'
}
