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
        <span className="type-heading-s">{label}</span>
        {required ? <span className="field-label__required type-eyebrow">*</span> : null}
      </div>
      <div className="field-control">{children}</div>
      {hint ? <div className="field-hint type-body-s">{hint}</div> : null}
      {error ? <div className="field-error type-body-s">{error}</div> : null}
    </label>
  )
}