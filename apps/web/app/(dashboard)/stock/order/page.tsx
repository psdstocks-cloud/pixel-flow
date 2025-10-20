'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Field, StatusBadge, Toast, useNotifications } from '../../../../components'
import {
  buildDownloadUrl,
  commitOrder,
  detectSiteAndIdFromUrl,
  fetchBalance,
  fetchSites,
  fetchTasks,
  previewOrder,
  queries,
  type CommitOrderPayload,
  type PreviewOrderPayload,
  type PreviewOrderResponse,
  type ResponseType,
  type StockOrderTask,
  type StockSite,
} from '../../../../lib/stock'
import { useSession } from '../../../../lib/session'

const MAX_LINKS = 5
const HISTORY_LIMIT = 25
const DEFAULT_RESPONSE_TYPE: ResponseType = 'any'

type PreviewEntry = PreviewOrderResponse['results'][number]
type Feedback = { type: 'success' | 'error'; message: string }

const RESPONSE_OPTIONS: Array<{ value: ResponseType; label: string }> = [
  { value: 'any', label: 'Any (auto)' },
  { value: 'gdrive', label: 'Google Drive' },
  { value: 'asia', label: 'Asia CDN' },
  { value: 'mydrivelink', label: 'My Drive Link' },
]

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatPoints(points?: number | null) {
  if (points == null) return '—'
  return `${points} pts`
}

function formatCost(task: StockOrderTask) {
  if (task.costAmount != null && task.costCurrency) {
    try {
      return currencyFormatter.format(task.costAmount)
    } catch {
      return `${task.costAmount} ${task.costCurrency}`
    }
  }
  if (task.costPoints != null) {
    return `${task.costPoints} pts`
  }
  return '—'
}

export default function StockOrderPage() {
  const { session, status: sessionStatus, error: sessionError } = useSession()
  const { notify } = useNotifications()
  const queryClient = useQueryClient()

  const userId = session?.userId ?? null
  const isAuthenticated = Boolean(userId)

  const [links, setLinks] = useState<string[]>([''])
  const [responseType, setResponseType] = useState<ResponseType>(DEFAULT_RESPONSE_TYPE)
  const [previewEntries, setPreviewEntries] = useState<PreviewEntry[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [previewFeedback, setPreviewFeedback] = useState<Feedback | null>(null)
  const [commitFeedback, setCommitFeedback] = useState<Feedback | null>(null)

  const pendingTaskIdsRef = useRef<string[]>([])

  const sitesQuery = useQuery({
    queryKey: queries.sites,
    queryFn: ({ signal }) => fetchSites(signal),
    staleTime: 5 * 60 * 1000,
  })

  const balanceQuery = useQuery({
    queryKey: userId ? queries.balance(userId) : ['stock', 'balance', 'anonymous'],
    queryFn: ({ signal }) => {
      if (!userId) throw new Error('Missing user context')
      return fetchBalance(userId, signal)
    },
    enabled: isAuthenticated,
    staleTime: 15_000,
  })

  const tasksQuery = useQuery({
    queryKey: userId ? queries.tasks(userId, HISTORY_LIMIT) : ['stock', 'tasks', 'anonymous'],
    queryFn: ({ signal }) => {
      if (!userId) throw new Error('Missing user context')
      return fetchTasks(userId, HISTORY_LIMIT, signal)
    },
    enabled: isAuthenticated,
    staleTime: 15_000,
  })

  const detectionHints = useMemo(() => {
    const sites = (sitesQuery.data ?? []) as StockSite[]
    return links.map((link) => {
      const trimmed = link.trim()
      if (!trimmed) return null
      return detectSiteAndIdFromUrl(trimmed, sites)
    })
  }, [links, sitesQuery.data])

  const previewMutation = useMutation({
    mutationFn: (payload: PreviewOrderPayload) => previewOrder(payload),
    onSuccess: (data) => {
      setPreviewEntries(data.results)
      setSelectedTaskIds(() => {
        const next = new Set<string>()
        data.results.forEach((result) => {
          if (result.task) next.add(result.task.taskId)
        })
        return next
      })
      setPreviewFeedback({
        type: data.results.some((result) => result.task) ? 'success' : 'error',
        message: data.results.some((result) => result.task)
          ? 'Preview ready. Confirm the assets you want to queue.'
          : 'No preview tasks were created. Verify the URLs and try again.',
      })
      setCommitFeedback(null)
      if (userId) {
        queryClient.setQueryData(queries.balance(userId), data.balance)
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to preview links. Please try again.'
      setPreviewFeedback({
        type: 'error',
        message,
      })
      notify({
        title: 'Preview failed',
        message,
        variant: 'error',
      })
    },
  })

  const commitMutation = useMutation({
    mutationFn: (payload: CommitOrderPayload) => commitOrder(payload),
    onMutate: (payload) => {
      pendingTaskIdsRef.current = payload.taskIds
    },
    onSuccess: (data) => {
      if (userId) {
        queryClient.setQueryData(queries.balance(userId), data.balance)
        void queryClient.invalidateQueries({ queryKey: queries.tasks(userId, HISTORY_LIMIT) })
      }

      const committedIds = new Set(pendingTaskIdsRef.current)
      const failureMap = new Map(data.failures.map((failure) => [failure.taskId, failure.error]))

      setPreviewEntries((prev) =>
        prev
          .map<PreviewEntry | null>((entry) => {
            if (!entry.task) return entry
            const { taskId } = entry.task
            if (!committedIds.has(taskId)) return entry
            if (!failureMap.has(taskId)) {
              return null
            }
            const updatedTask = data.tasks.find((task) => task.taskId === taskId) ?? entry.task
            return {
              task: {
                ...updatedTask,
                status: 'error',
                latestMessage: failureMap.get(taskId) ?? updatedTask.latestMessage,
              },
              error: failureMap.get(taskId) ?? entry.error,
            }
          })
          .filter((entry): entry is PreviewEntry => Boolean(entry)),
      )

      setSelectedTaskIds(new Set(failureMap.keys()))

      setCommitFeedback({
        type: data.failures.length > 0 ? 'error' : 'success',
        message:
          data.failures.length > 0
            ? 'Some orders could not be queued. Review the errors below.'
            : 'All selected orders were queued successfully.',
      })
      notify({
        title: data.failures.length > 0 ? 'Orders partially queued' : 'Orders queued',
        message:
          data.failures.length > 0
            ? 'Some orders could not be queued. Check the errors below.'
            : 'All selected orders were queued successfully.',
        variant: data.failures.length > 0 ? 'error' : 'success',
      })

      if (data.failures.length === 0) {
        setPreviewEntries([])
        setSelectedTaskIds(new Set())
        setPreviewFeedback(null)
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to queue the selected orders.'
      setCommitFeedback({
        type: 'error',
        message,
      })
      notify({
        title: 'Unable to queue orders',
        message,
        variant: 'error',
      })
    },
  })

  const handleLinkChange = (index: number, value: string) => {
    setLinks((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddLink = () => {
    setLinks((prev) => {
      if (prev.length >= MAX_LINKS) return prev
      return [...prev, '']
    })
  }

  const handleRemoveLink = (index: number) => {
    setLinks((prev) => {
      if (prev.length === 1) return ['']
      return prev.filter((_, idx) => idx !== index)
    })
  }

  const handlePreviewSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!userId) {
      setPreviewFeedback({ type: 'error', message: 'Sign in to preview and queue stock downloads.' })
      notify({
        title: 'Sign in required',
        message: 'Create an account, activate it, and purchase a points package to continue.',
        variant: 'error',
      })
      return
    }

    const items = links
      .map((link) => link.trim())
      .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index)

    if (items.length === 0) {
      setPreviewFeedback({ type: 'error', message: 'Add at least one asset URL before previewing.' })
      notify({
        title: 'Add URLs first',
        message: 'Add at least one asset URL before previewing.',
        variant: 'error',
      })
      return
    }

    setPreviewFeedback(null)
    setCommitFeedback(null)

    const payload: PreviewOrderPayload = {
      userId,
      responsetype: responseType,
      items: items.map((url) => ({ url })),
    }

    previewMutation.mutate(payload)
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const removePreviewTask = (taskId: string) => {
    setPreviewEntries((prev) => prev.filter((entry) => entry.task?.taskId !== taskId))
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }

  const commitOrders = (taskIds: string[]) => {
    if (!userId || taskIds.length === 0) return
    const payload: CommitOrderPayload = {
      userId,
      taskIds,
      responsetype: responseType,
    }
    commitMutation.mutate(payload)
  }

  const handleConfirmSelected = () => {
    commitOrders(Array.from(selectedTaskIds))
  }

  const handleCommitSingle = (taskId: string) => {
    commitOrders([taskId])
  }

  const clearPreviewState = () => {
    setPreviewEntries([])
    setSelectedTaskIds(new Set())
    setPreviewFeedback(null)
    setCommitFeedback(null)
  }

  const selectedPreviewTasks = previewEntries.filter(
    (entry): entry is PreviewEntry & { task: StockOrderTask } => Boolean(entry.task && selectedTaskIds.has(entry.task.taskId)),
  )

  const totalSelectedPoints = selectedPreviewTasks.reduce((sum, entry) => sum + (entry.task.costPoints ?? 0), 0)

  const providerCount = sitesQuery.data?.length ?? 0
  const nextPaymentLabel = session?.nextPaymentDue
    ? dateTimeFormatter.format(new Date(session.nextPaymentDue))
    : 'Not scheduled'
  const historyTasks = tasksQuery.data ?? []

  const showSignInWarning = sessionStatus === 'ready' && !isAuthenticated

  return (
    <main>
      <section className="order-hero">
        <span className="hero-badge">Stock workflow</span>
        <h1>Preview, confirm, and download stock assets in one flow.</h1>
        <p className="hero-description">
          Paste up to five links, inspect costs and previews, and only spend points once you confirm the order.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span className="glass-chip">Providers live: {providerCount}</span>
          <span className="glass-chip">Points based billing</span>
          <span className="glass-chip">Monthly renewal reminders</span>
        </div>
      </section>

      {sessionStatus === 'loading' ? (
        <Toast title="Loading account" message="Fetching your session details." variant="info" />
      ) : null}
      {sessionError ? <Toast title="Session unavailable" message={sessionError.message} variant="error" /> : null}
      {showSignInWarning ? (
        <Toast
          title="Sign in required"
          message="Create an account, activate it, and purchase a points package to continue."
          variant="error"
        />
      ) : null}

      <div className="tab-panel split">
        <Card
          title="Prepare your batch"
          description="Add up to five asset URLs. We’ll preview costs before you spend any points."
        >
          <>
            <form className="form-grid" onSubmit={handlePreviewSubmit}>
              {links.map((link, index) => {
                const detection = detectionHints[index]
                const hint = detection
                  ? `Detected provider: ${detection.site ?? 'unknown'}${detection.id ? ` · asset ${detection.id}` : ''}`
                  : 'Paste a direct asset URL. Provider detection runs automatically.'
                return (
                  <div key={`link-row-${index}`} className="link-input-row">
                    <Field label={`Asset URL ${index + 1}`} hint={hint}>
                      <div className="link-input-wrapper">
                        <input
                          value={link}
                          onChange={(event) => handleLinkChange(index, event.target.value)}
                          placeholder="https://provider.com/path/to/asset"
                          autoComplete="off"
                          disabled={!isAuthenticated}
                        />
                        {links.length > 1 ? (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => handleRemoveLink(index)}
                            style={{ marginLeft: 8 }}
                            disabled={!isAuthenticated}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </Field>
                  </div>
                )
              })}

              <div className="form-actions" style={{ gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="secondary"
                    onClick={handleAddLink}
                    disabled={!isAuthenticated || links.length >= MAX_LINKS}
                  >
                    Add URL
                  </button>

                  <Field label="Response type" hint="Prefer a delivery target?">
                    <select
                      value={responseType}
                      onChange={(event) => setResponseType(event.target.value as ResponseType)}
                      disabled={!isAuthenticated}
                    >
                      {RESPONSE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <button
                  className="primary"
                  type="submit"
                  disabled={!isAuthenticated || previewMutation.isPending}
                >
                  <span className="button-content">
                    {previewMutation.isPending ? <span className="button-spinner" aria-hidden="true" /> : null}
                    {previewMutation.isPending ? 'Previewing…' : 'Preview order'}
                  </span>
                </button>

                {previewEntries.length > 0 || previewMutation.isPending ? (
                  <button type="button" className="secondary" onClick={clearPreviewState} disabled={previewMutation.isPending}>
                    Reset preview
                  </button>
                ) : null}
              </div>
            </form>

            {previewFeedback ? (
              <Toast
                title={previewFeedback.type === 'success' ? 'Preview complete' : 'Preview failed'}
                message={previewFeedback.message}
                variant={previewFeedback.type === 'success' ? 'success' : 'error'}
              />
            ) : null}
            {sitesQuery.isError ? (
              <Toast
                title="Unable to load providers"
                message={sitesQuery.error instanceof Error ? sitesQuery.error.message : 'Provider list unavailable.'}
                variant="error"
              />
            ) : null}
          </>
        </Card>

        <Card
          title="Preview results"
          description="Select the assets you’d like to confirm. Points are only deducted on confirmation."
          headerSlot={
            selectedPreviewTasks.length > 0 ? (
              <span className="glass-chip">Selected cost: {totalSelectedPoints} pts</span>
            ) : null
          }
        >
          <>
            {previewEntries.length === 0 ? (
              <p style={{ color: 'var(--pf-text-subtle)', margin: 0 }}>
                Previewed links will appear here with cost, provider, and status information.
              </p>
            ) : (
              <div className="preview-results" style={{ display: 'grid', gap: 16 }}>
                {previewEntries.map((entry, index) => {
                  if (!entry.task) {
                    return (
                      <Toast
                        key={`preview-error-${index}`}
                        title="Preview failed"
                        message={entry.error ?? 'Unknown error while preparing this asset.'}
                        variant="error"
                      />
                    )
                  }

                  const task = entry.task
                  const isSelected = selectedTaskIds.has(task.taskId)
                  const createdAtLabel = dateTimeFormatter.format(new Date(task.createdAt))

                  return (
                    <div key={task.taskId} className="bulk-result-card" style={{ display: 'grid', gap: 12 }}>
                      <div className="bulk-result-header" style={{ alignItems: 'flex-start', gap: 12 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTaskSelection(task.taskId)}
                          aria-label={`Select task ${task.taskId}`}
                        />
                        <div style={{ flex: 1, display: 'grid', gap: 4 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <StatusBadge status={task.status} />
                            <strong>{task.title ?? task.sourceUrl}</strong>
                          </div>
                          <span className="status-meta">Created: {createdAtLabel}</span>
                          <span className="status-meta">Cost: {formatCost(task)}</span>
                          {task.latestMessage ? <span className="status-meta">{task.latestMessage}</span> : null}
                          {entry.error ? <span style={{ color: 'var(--pf-error)', fontSize: 13 }}>{entry.error}</span> : null}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => handleCommitSingle(task.taskId)}
                            disabled={!isSelected || commitMutation.isPending}
                          >
                            Queue now
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => removePreviewTask(task.taskId)}
                            disabled={commitMutation.isPending}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {previewEntries.some((entry) => entry.task) ? (
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="primary"
                  onClick={handleConfirmSelected}
                  disabled={selectedTaskIds.size === 0 || commitMutation.isPending}
                >
                  <span className="button-content">
                    {commitMutation.isPending ? <span className="button-spinner" aria-hidden="true" /> : null}
                    {commitMutation.isPending ? 'Confirming…' : 'Confirm selected orders'}
                  </span>
                </button>
              </div>
            ) : null}

            {commitFeedback ? (
              <Toast
                title={commitFeedback.type === 'success' ? 'Orders queued' : 'Could not queue all orders'}
                message={commitFeedback.message}
                variant={commitFeedback.type === 'success' ? 'success' : 'error'}
              />
            ) : null}
          </>
        </Card>
      </div>

      <div className="tab-panel split">
        <Card title="Account summary" description="Track your available points and monthly renewal date.">
          <>
            {balanceQuery.isLoading ? (
              <Toast title="Checking balance" message="Fetching your latest point balance." variant="info" />
            ) : balanceQuery.isError ? (
              <Toast
                title="Balance unavailable"
                message={balanceQuery.error instanceof Error ? balanceQuery.error.message : 'Could not load balance.'}
                variant="error"
              />
            ) : balanceQuery.data ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 600 }}>{balanceQuery.data.points} pts</span>
                <span className="status-meta">User ID: {balanceQuery.data.userId}</span>
                <span className="status-meta">Next payment: {nextPaymentLabel}</span>
                <Link href="/billing" className="link-button" style={{ marginTop: 8 }}>
                  Manage subscription
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                <p style={{ color: 'var(--pf-text-subtle)', margin: 0 }}>Purchase a package to load your balance.</p>
                <Link href="/billing" className="primary">
                  View packages
                </Link>
              </div>
            )}
          </>
        </Card>

        <Card title="Recent downloads" description="Review recently queued tasks and re-download when ready.">
          <>
            {tasksQuery.isLoading ? (
              <Toast title="Loading history" message="Fetching recent stock tasks." variant="info" />
            ) : tasksQuery.isError ? (
              <Toast
                title="History unavailable"
                message={tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Could not load history.'}
                variant="error"
              />
            ) : historyTasks.length === 0 ? (
              <p style={{ color: 'var(--pf-text-subtle)', margin: 0 }}>No tasks yet. Confirm an order to populate history.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {historyTasks.map((task) => {
                  const createdAtLabel = dateTimeFormatter.format(new Date(task.createdAt))
                  const updatedAtLabel = dateTimeFormatter.format(new Date(task.updatedAt))
                  const downloadHref = task.downloadUrl ?? buildDownloadUrl(task.taskId, task.responsetype ?? 'any')
                  const canDownload = ['ready', 'completed', 'success'].includes(task.status.toLowerCase())
                  return (
                    <div key={task.taskId} className="bulk-result-card" style={{ display: 'grid', gap: 8 }}>
                      <div className="bulk-result-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <StatusBadge status={task.status} />
                          <strong>{task.title ?? task.sourceUrl}</strong>
                        </div>
                        <span className="glass-chip">{formatCost(task)}</span>
                      </div>
                      <div className="status-meta" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span>Task ID: {task.taskId}</span>
                        {task.externalTaskId ? <span>Provider task: {task.externalTaskId}</span> : null}
                        <span>Created: {createdAtLabel}</span>
                        <span>Updated: {updatedAtLabel}</span>
                      </div>
                      {task.latestMessage ? <span className="status-meta">{task.latestMessage}</span> : null}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {canDownload ? (
                          <a
                            href={downloadHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-button"
                          >
                            Download
                          </a>
                        ) : null}
                        <span className="status-meta">Points spent: {formatPoints(task.costPoints)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        </Card>
      </div>

      <div className="tab-panel single">
        <Card title="Provider catalog" description="Browse live providers, pricing, and availability.">
          {sitesQuery.isLoading ? (
            <Toast title="Loading providers" message="Fetching provider catalog." variant="info" />
          ) : sitesQuery.isError ? (
            <Toast
              title="Unavailable"
              message={sitesQuery.error instanceof Error ? sitesQuery.error.message : 'Could not load provider catalog.'}
              variant="error"
            />
          ) : sitesQuery.data && sitesQuery.data.length > 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {sitesQuery.data.map((site) => {
                const priceDisplay =
                  site.price != null ? `${site.price}${site.currency ? ` ${site.currency}` : ''}` : '—'
                return (
                  <div key={site.site} className="bulk-result-card" style={{ background: 'rgba(15, 23, 42, 0.45)' }}>
                    <div className="bulk-result-header" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <strong>{site.displayName ?? site.site}</strong>
                        <span style={{ color: 'var(--pf-text-subtle)', fontSize: 13 }}>{site.site}</span>
                      </div>
                      <span
                        className="glass-chip"
                        style={{
                          background:
                            site.active === false ? 'rgba(251, 113, 133, 0.2)' : 'rgba(74, 222, 128, 0.18)',
                          borderColor:
                            site.active === false ? 'rgba(251, 113, 133, 0.45)' : 'rgba(74, 222, 128, 0.45)',
                          color: site.active === false ? '#fecaca' : '#bbf7d0',
                        }}
                      >
                        {site.active === false ? 'Offline' : 'Online'}
                      </span>
                    </div>
                    <div className="status-meta">
                      <span>Price: {priceDisplay}</span>
                      {site.minPrice != null ? (
                        <span>
                          Min price: {site.minPrice}
                          {site.currency ? ` ${site.currency}` : ''}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--pf-text-subtle)', margin: 0 }}>No providers are currently configured.</p>
          )}
        </Card>
      </div>
    </main>
  )
}
