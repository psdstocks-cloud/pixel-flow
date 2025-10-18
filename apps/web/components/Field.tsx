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
    <label className="field-root" htmlFor={htmlFor}>
      <div className="field-label">
        {label}
        {required ? <span style={{ color: 'var(--pf-error)', marginLeft: 4 }}>*</span> : null}
      </div>
      <div className="field-control">{children}</div>
      {hint ? <div className="field-hint">{hint}</div> : null}
      {error ? <div className="field-error">{error}</div> : null}
    </label>
  )
}