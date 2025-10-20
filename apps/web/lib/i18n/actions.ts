'use server'

import { cookies } from 'next/headers'
import { LOCALE_COOKIE, type Locale, isSupportedLocale } from '../i18n-config'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function setLocale(locale: Locale) {
  if (!isSupportedLocale(locale)) return

  cookies().set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  })
}
