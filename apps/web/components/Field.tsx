import type { ReactNode } from 'react'

type FieldProps = {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}

export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  return (
    <label style={{ display: 'block', width: '100%' }} htmlFor={htmlFor}>
      <div style={{ fontWeight: 500, marginBottom: 6 }}>
        {label}
        {required ? <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span> : null}
      </div>
      {children}
      {hint ? <div style={{ marginTop: 6, color: '#64748b' }}>{hint}</div> : null}
      {error ? <div style={{ marginTop: 6, color: '#ef4444', fontWeight: 500 }}>{error}</div> : null}
    </label>
  )
}