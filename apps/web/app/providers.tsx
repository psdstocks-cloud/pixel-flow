'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from '../lib/session'
import { NotificationsProvider } from '../components/NotificationCenter'
import { LocaleProvider } from '../lib/i18n/context'
import type { Locale } from '../lib/i18n-config'

const DEVTOOLS_ENABLED = process.env.NODE_ENV === 'development'

export function AppProviders({ children, locale }: { children: ReactNode; locale: Locale }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 2,
            staleTime: 30_000,
          },
        },
      }),
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider locale={locale}>
          <NotificationsProvider>
            {children}
            {DEVTOOLS_ENABLED ? <ReactQueryDevtools initialIsOpen={false} /> : null}
          </NotificationsProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
