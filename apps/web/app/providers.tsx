'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from '../lib/session'
import { NotificationsProvider } from '../components/NotificationCenter'

const DEVTOOLS_ENABLED = process.env.NODE_ENV === 'development'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <NotificationsProvider>
          {children}
        </NotificationsProvider>
      </SessionProvider>
      {DEVTOOLS_ENABLED && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
