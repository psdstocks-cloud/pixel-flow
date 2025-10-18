import type { ReactNode } from 'react'

type CardProps = {
  title?: string
  description?: string
  footer?: ReactNode
  className?: string
  headerSlot?: ReactNode
  children: ReactNode
}

export function Card({ title, description, footer, className, headerSlot, children }: CardProps) {
  const classes = ['glass-card']
  if (className) classes.push(className)

  return (
    <section className={classes.join(' ')}>
      {(title || description || headerSlot) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            {title ? <h2 style={{ margin: 0 }}>{title}</h2> : null}
            {description ? <p style={{ margin: 0 }}>{description}</p> : null}
          </div>
          {headerSlot ?? null}
        </div>
      )}
      <div style={{ display: 'grid', gap: 20 }}>{children}</div>
      {footer ? <div style={{ marginTop: 24 }}>{footer}</div> : null}
    </section>
  )
}