import type { ReactNode } from 'react'

type CardProps = {
  title?: string
  description?: string
  footer?: ReactNode
  className?: string
  children: ReactNode
}

export function Card({ title, description, footer, className, children }: CardProps) {
  return (
    <section className={`card ${className ?? ''}`}>
      {title ? <h2>{title}</h2> : null}
      {description ? <p>{description}</p> : null}
      <div>{children}</div>
      {footer ? <div style={{ marginTop: 16 }}>{footer}</div> : null}
    </section>
  )
}