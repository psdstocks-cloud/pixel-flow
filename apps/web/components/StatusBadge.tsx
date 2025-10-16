type StatusBadgeProps = {
    status: string
  }
  
  const statusStyles: Record<string, { background: string; color: string }> = {
    ready: { background: '#dbeafe', color: '#1d4ed8' },
    queued: { background: '#fef3c7', color: '#92400e' },
    pending: { background: '#fef3c7', color: '#92400e' },
    running: { background: '#dbeafe', color: '#1d4ed8' },
    processing: { background: '#dbeafe', color: '#1d4ed8' },
    completed: { background: '#dcfce7', color: '#166534' },
    failed: { background: '#fee2e2', color: '#b91c1c' },
    error: { background: '#fee2e2', color: '#b91c1c' },
    cancelled: { background: '#e2e8f0', color: '#1e293b' },
    canceled: { background: '#e2e8f0', color: '#1e293b' },
    default: { background: '#e2e8f0', color: '#1e293b' },
  }
  
  export function StatusBadge({ status }: StatusBadgeProps) {
    const key = status.toLowerCase()
    const palette = statusStyles[key] ?? statusStyles.default
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          ...palette,
        }}
      >
        {status}
      </span>
    )
  }