'use client'

/**
 * Session Expiry Warning Component
 * Shows warning before session expires
 */

import { useState, useEffect } from 'react'
// ❌ Remove this line:
// import { useAuth } from '@/context/AuthContext'

interface SessionExpiryWarningProps {
  show: boolean
  onExtend: () => void
  onLogout: () => void
  countdown?: number
}

export function SessionExpiryWarning({
  show,
  onExtend,
  onLogout,
  countdown = 300 // 5 minutes in seconds
}: SessionExpiryWarningProps) {
  const [timeLeft, setTimeLeft] = useState(countdown)

  useEffect(() => {
    if (!show) {
      setTimeLeft(countdown)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [show, countdown, onLogout])

  if (!show) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Session Expiring Soon
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Your session will expire in{' '}
          <span className="font-bold text-red-600 dark:text-red-400">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          . Would you like to extend your session?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onExtend}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Extend Session
          </button>
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  )
}
