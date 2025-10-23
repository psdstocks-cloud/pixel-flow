import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 ${className}`}>
      {title && (
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      )}
      {children}
    </div>
  )
}
