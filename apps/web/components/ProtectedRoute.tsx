'use client'

/**
 * Protected Route Component
 * Requires authentication and handles session timeout
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { SessionExpiryWarning } from './SessionExpiryWarning'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)

  // Session timeout with 30-minute inactivity
  useSessionTimeout({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // Warn 5 minutes before
    onWarning: () => setShowWarning(true),
    onTimeout: async () => {
      await signOut()
    }
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleExtendSession = () => {
    setShowWarning(false)
    // Trigger an activity event to reset timeout
    document.dispatchEvent(new Event('click'))
  }

  const handleLogout = async () => {
    setShowWarning(false)
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      {children}
      <SessionExpiryWarning
        show={showWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
    </>
  )
}
