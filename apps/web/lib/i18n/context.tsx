'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { Locale } from '../i18n-config'

const LocaleContext = createContext<Locale>('en')

export function LocaleProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}
