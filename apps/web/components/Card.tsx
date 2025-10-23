import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
}

export function Card({ children, className = '', title, description }: CardProps) {
  return (
    <div className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 ${className}`}>
      {title && (
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-white/70 text-sm mb-4">{description}</p>
      )}
      {children}
    </div>
  )
}
