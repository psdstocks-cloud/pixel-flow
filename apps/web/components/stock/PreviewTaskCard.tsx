'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { StockOrderTask } from '../../lib/stock'
import { StatusBadge } from '../StatusBadge'

export type PreviewTaskCardVariant = 'primary' | 'secondary' | 'error' | 'disabled'

export type PreviewTaskCardProps = {
  task: StockOrderTask
  costLabel: string
  createdAtLabel: string
  error?: string | null
  isSelected: boolean
  onToggle: () => void
  onQueue?: () => void
  onRemove?: () => void
  selectionDisabled?: boolean
  queueDisabled?: boolean
  removeDisabled?: boolean
  variant?: PreviewTaskCardVariant
}

export function PreviewTaskCard({
  task,
  costLabel,
  createdAtLabel,
  error,
  isSelected,
  onToggle,
  onQueue,
  onRemove,
  selectionDisabled = false,
  queueDisabled = false,
  removeDisabled = false,
  variant = 'secondary',
}: PreviewTaskCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const thumbnailCandidate = task.thumbnailUrl ?? task.previewUrl ?? undefined
  const thumbnail = imageFailed ? undefined : thumbnailCandidate
  const title = task.title ?? task.assetId ?? task.sourceUrl
  const provider = task.site ?? 'Unknown provider'
  const latestMessage = task.latestMessage ?? undefined

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (selectionDisabled) return
    if (target.closest('button')) return
    onToggle()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (selectionDisabled) return
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      onToggle()
    }
  }

  const handleQueue = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onQueue?.()
  }

  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onRemove?.()
  }

  const cardClasses = clsx('preview-task-card', `preview-task-card--${variant}`, {
    'preview-task-card--selected': isSelected,
  })

  return (
    <motion.article
      className={cardClasses}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={selectionDisabled ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      whileHover={selectionDisabled ? undefined : { scale: 1.01 }}
      whileTap={selectionDisabled ? undefined : { scale: 0.995 }}
      data-selected={isSelected ? 'true' : 'false'}
      data-status={task.status?.toLowerCase() ?? 'unknown'}
    >
      <div className="preview-task-card__media" aria-hidden>
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title ?? provider ?? 'Asset thumbnail'}
            fill
            sizes="(min-width: 1024px) 220px, 100vw"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="preview-task-card__media-placeholder">
            <span>{provider?.[0]?.toUpperCase() ?? '?'}</span>
          </div>
        )}
        <div className="preview-task-card__status">
          <StatusBadge status={task.status} />
        </div>
      </div>

      <div className="preview-task-card__content">
        <div className="preview-task-card__header">
          <h3 className="type-heading-m">{title}</h3>
          <span className="preview-task-card__provider type-body-s">{provider}</span>
        </div>

        <div className="preview-task-card__meta type-body-s">
          <span>Created: {createdAtLabel}</span>
          <span>Cost: {costLabel}</span>
          {task.costPoints != null ? <span>Points: {task.costPoints}</span> : null}
        </div>

        {latestMessage ? <p className="preview-task-card__message type-body-s">{latestMessage}</p> : null}
        {error ? <p className="preview-task-card__error type-body-s">{error}</p> : null}
      </div>

      <div className="preview-task-card__actions">
        {onQueue ? (
          <button type="button" className="primary" onClick={handleQueue} disabled={queueDisabled || !isSelected}>
            Queue now
          </button>
        ) : null}
        {onRemove ? (
          <button type="button" className="secondary" onClick={handleRemove} disabled={removeDisabled}>
            Remove
          </button>
        ) : null}
      </div>
    </motion.article>
  )
}
