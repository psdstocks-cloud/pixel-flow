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
        <div className="card-header">
          <div className="card-title-group">
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {headerSlot ? <div>{headerSlot}</div> : null}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer ? <div className="card-footer">{footer}</div> : null}
    </section>
  )
}