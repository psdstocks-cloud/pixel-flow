'use client'

/**
 * Session Timeout Hook
 * Auto-logout after inactivity period
 */

import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

interface UseSessionTimeoutOptions {
  // Timeout in milliseconds (default: 30 minutes)
  timeout?: number
  // Warning before timeout in milliseconds (default: 5 minutes before)
  warningTime?: number
  // Callback when warning is triggered
  onWarning?: () => void
  // Callback when timeout occurs
  onTimeout?: () => void
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const {
    timeout = 30 * 60 * 1000, // 30 minutes
    warningTime = 5 * 60 * 1000, // 5 minutes before timeout
    onWarning,
    onTimeout
  } = options

  const { signOut, user } = useAuth()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimeout = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    // Only set timers if user is logged in
    if (!user) return

    // Set warning timer
    warningRef.current = setTimeout(() => {
      console.warn('⚠️ Session expiring soon')
      onWarning?.()
    }, timeout - warningTime)

    // Set timeout timer
    timeoutRef.current = setTimeout(async () => {
      console.warn('⏱️ Session timeout - logging out')
      onTimeout?.()
      await signOut()
    }, timeout)
  }, [timeout, warningTime, onWarning, onTimeout, signOut, user])

  useEffect(() => {
    if (!user) return

    // Events that reset the timeout
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    // Reset timeout on user activity
    const handleActivity = () => {
      resetTimeout()
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })

    // Initial timeout setup
    resetTimeout()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
    }
  }, [user, resetTimeout])
}
