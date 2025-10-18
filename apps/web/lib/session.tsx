'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type SessionState = {
  userId: string | null
  email?: string | null
  nextPaymentDue?: string | null
}

export type SessionContextValue = {
  session: SessionState | null
  status: 'loading' | 'ready' | 'error'
  error: Error | null
  refresh: () => Promise<void>
  setSession: (session: SessionState | null) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? null

async function fetchSessionFromApi(): Promise<SessionState | null> {
  try {
    const response = await fetch('/api/auth/session', { credentials: 'include' })
    if (!response.ok) {
      throw new Error(`Session request failed: ${response.status}`)
    }
    const body = (await response.json()) as {
      user?: { id?: string; email?: string; nextPaymentDue?: string }
    }
    const userId = body?.user?.id ?? DEFAULT_USER_ID
    if (!userId) return null
    return {
      userId,
      email: body?.user?.email ?? null,
      nextPaymentDue: body?.user?.nextPaymentDue ?? null,
    }
  } catch (error) {
    if (DEFAULT_USER_ID) {
      return { userId: DEFAULT_USER_ID }
    }
    throw error instanceof Error ? error : new Error('Unknown session error')
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<Error | null>(null)

  const loadSession = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const nextSession = await fetchSessionFromApi()
      setSession(nextSession)
      setStatus('ready')
    } catch (err) {
      setError(err as Error)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  const value = useMemo<SessionContextValue>(
    () => ({ session, status, error, refresh: loadSession, setSession }),
    [session, status, error, loadSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
