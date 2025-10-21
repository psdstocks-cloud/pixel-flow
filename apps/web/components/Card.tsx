import type { ReactNode } from 'react'

type CardProps = {
  title?: string
  description?: string
  footer?: ReactNode
  className?: string
  headerSlot?: ReactNode
  icon?: ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'outline'
  titleSize?: 'heading-l' | 'heading-m' | 'heading-s'
  descriptionSize?: 'body-l' | 'body-m' | 'body-s'
  children: ReactNode
}

export function Card({
  title,
  description,
  footer,
  className,
  headerSlot,
  icon,
  variant = 'default',
  titleSize = 'heading-l',
  descriptionSize = 'body-m',
  children,
}: CardProps) {
  const classes = ['glass-card', 'card']
  if (variant !== 'default') {
    classes.push(`card--${variant}`)
  }
  if (className) classes.push(className)

  const titleClass = titleSize ? `type-${titleSize}` : undefined
  const descriptionClass = descriptionSize ? `type-${descriptionSize}` : undefined

  return (
    <section className={classes.join(' ')}>
      {(title || description || headerSlot) && (
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-title-group__heading">
              {icon ? <span className="card__icon-ring" aria-hidden>{icon}</span> : null}
              {title ? <h2 className={titleClass}>{title}</h2> : null}
            </div>
            {description ? <p className={descriptionClass}>{description}</p> : null}
          </div>
          {headerSlot ? <div>{headerSlot}</div> : null}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer ? <div className="card-footer">{footer}</div> : null}
    </section>
  )
}