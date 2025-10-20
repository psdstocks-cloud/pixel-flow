'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Toast, type ToastVariant } from './Toast'

type NotifyOptions = {
  title: string
  message?: string
  variant?: ToastVariant
  duration?: number
  actionSlot?: ReactNode
}

type NotificationEntry = Required<Pick<NotifyOptions, 'title'>> & {
  id: string
  message?: string
  variant: ToastVariant
  actionSlot?: ReactNode
}

type NotificationContextValue = {
  notify: (options: NotifyOptions) => string
  dismiss: (id: string) => void
  clear: () => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

function createNotificationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const clear = useCallback(() => {
    setNotifications([])
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  const notify = useCallback(
    ({ title, message, variant = 'info', duration = 6000, actionSlot }: NotifyOptions) => {
      const id = createNotificationId()
      setNotifications((prev) => [...prev, { id, title, message, variant, actionSlot }])
      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          dismiss(id)
        }, duration)
        timersRef.current.set(id, timeoutId)
      }
      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const value = useMemo<NotificationContextValue>(() => ({ notify, dismiss, clear }), [notify, dismiss, clear])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notification-stack" role="region" aria-live="polite" aria-label="Notifications">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            title={notification.title}
            message={notification.message}
            variant={notification.variant}
            actionSlot={
              <div className="toast-actions">
                {notification.actionSlot}
                <button
                  type="button"
                  className="toast-dismiss"
                  onClick={() => dismiss(notification.id)}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>
            }
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
