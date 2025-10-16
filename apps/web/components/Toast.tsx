import type { ReactNode } from 'react'

export type ToastVariant = 'info' | 'success' | 'error'

const palette: Record<ToastVariant, { background: string; border: string; color: string }> = {
  info: { background: '#dbeafe', border: '#2563eb', color: '#1d4ed8' },
  success: { background: '#dcfce7', border: '#22c55e', color: '#166534' },
  error: { background: '#fee2e2', border: '#ef4444', color: '#991b1b' },
}

export function Toast({
  title,
  message,
  actionSlot,
  variant = 'info',
}: {
  title: string
  message?: string
  actionSlot?: ReactNode
  variant?: ToastVariant
}) {
  const { background, border, color } = palette[variant]
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        padding: '12px 18px',
        borderRadius: 14,
        border: `1px solid ${border}`,
        background,
        color,
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
      }}
    >
      <div style={{ flex: 1 }}>
        <strong style={{ display: 'block', marginBottom: 6 }}>{title}</strong>
        {message ? <span>{message}</span> : null}
      </div>
      {actionSlot}
    </div>
  )
}
