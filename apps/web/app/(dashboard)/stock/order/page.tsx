'use client'

import { ChangeEvent, FormEvent, Fragment, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  Field,
  OrderSummaryPanel,
  PreviewTaskCard,
  StatusBadge,
  Toast,
  useNotifications,
} from '../../../../components'
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
} from '../../../../lib/stock'
import { useSession } from '../../../../lib/session'

const MAX_LINKS = 5
const HISTORY_LIMIT = 25
const DEFAULT_RESPONSE_TYPE: ResponseType = 'any'

type OrderMode = 'batch' | 'single'
type OrderInputs = { batch: string; single: string }
type PreviewEntry = PreviewOrderResponse['results'][number]
type Feedback = { type: 'success' | 'error'; message: string }

function getPreviewVariant(status: string | undefined) {
  const normalized = status?.toLowerCase() ?? 'unknown'
  if (['ready', 'success', 'completed'].includes(normalized)) return 'primary'
  if (['error', 'failed', 'cancelled'].includes(normalized)) return 'error'
  if (['pending', 'processing', 'detecting'].includes(normalized)) return 'disabled'
  return 'secondary'
}

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

  const [orderMode, setOrderMode] = useState<OrderMode>('batch')
  const [inputs, setInputs] = useState<OrderInputs>({ batch: '', single: '' })
  const [responseType, setResponseType] = useState<ResponseType>(DEFAULT_RESPONSE_TYPE)
  const [previewEntries, setPreviewEntries] = useState<PreviewEntry[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [previewFeedback, setPreviewFeedback] = useState<Feedback | null>(null)
  const [commitFeedback, setCommitFeedback] = useState<Feedback | null>(null)

  const pendingTaskIdsRef = useRef<string[]>([])

  const isBatchMode = orderMode === 'batch'
  const isSingleMode = orderMode === 'single'

  const batchInput = inputs.batch
  const singleInput = inputs.single

  const batchLinks = useMemo<string[]>(() => {
    return batchInput
      .replace(/\r/g, '')
      .split('\n')
      .map((rawLine: string) => rawLine.trim())
      .filter((trimmedLine: string) => trimmedLine.length > 0)
      .slice(0, MAX_LINKS)
  }, [batchInput])

  const singleLink = useMemo(() => singleInput.trim(), [singleInput])

  const activeLinks = useMemo<string[]>(() => {
    if (isBatchMode) {
      return batchLinks
    }

    return singleLink ? [singleLink] : []
  }, [isBatchMode, batchLinks, singleLink])
  const totalLinkCount = activeLinks.length

  const sitesQuery = useQuery({
    queryKey: queries.sites,
    queryFn: ({ signal }) => fetchSites(signal),
    staleTime: 5 * 60 * 1000,
  })

  const accessToken = session?.accessToken

  const balanceQuery = useQuery({
    queryKey: userId ? queries.balance(userId) : ['stock', 'balance', 'anonymous'],
    queryFn: ({ signal }) => {
      if (!userId) throw new Error('Missing user context')
      return fetchBalance(userId, accessToken ?? undefined, signal)
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

  const detectionHints = useMemo(() => activeLinks.map((link) => detectSiteAndIdFromUrl(link)), [activeLinks])

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
          .map<PreviewEntry | null>((entry: PreviewEntry) => {
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

  const clearPreviewState = () => {
    setPreviewEntries([])
    setSelectedTaskIds(new Set())
    setPreviewFeedback(null)
    setCommitFeedback(null)
  }

  const setBatchInput = (value: string | ((prev: string) => string)) => {
    setInputs((prev: OrderInputs) => {
      const next = typeof value === 'function' ? value(prev.batch) : value
      return { ...prev, batch: next }
    })
  }

  const setSingleInput = (value: string | ((prev: string) => string)) => {
    setInputs((prev: OrderInputs) => {
      const next = typeof value === 'function' ? value(prev.single) : value
      return { ...prev, single: next }
    })
  }

  const handleModeChange = (nextMode: OrderMode) => {
    if (nextMode === orderMode) return
    setOrderMode(nextMode)

    if (nextMode === 'single') {
      setSingleInput(batchLinks[0] ?? singleLink)
    } else {
      setBatchInput((current) => {
        if (current.trim().length > 0) return current
        return singleLink.length > 0 ? singleLink : current
      })
    }

    clearPreviewState()
  }

  const handleBatchInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const normalized = event.target.value.replace(/\r/g, '')
    const limitedLines = normalized.split('\n').slice(0, MAX_LINKS)
    setBatchInput(limitedLines.join('\n'))
  }

  const handleSingleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSingleInput(event.target.value.replace(/\r?\n/g, ''))
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

    const uniqueItems = new Map<string, { url: string; site?: string; id?: string }>()

    activeLinks.forEach((link: string, index: number) => {
      const trimmed = link.trim()
      if (!trimmed) return
      if (!uniqueItems.has(trimmed)) {
        const detection = detectionHints[index]
        uniqueItems.set(trimmed, {
          url: trimmed,
          site: detection?.site ?? undefined,
          id: detection?.id ?? undefined,
        })
      }
    })

    const items = Array.from(uniqueItems.values())

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
      items,
    }

    previewMutation.mutate(payload)
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev: Set<string>) => {
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
    setPreviewEntries((prev: PreviewEntry[]) => prev.filter((entry: PreviewEntry) => entry.task?.taskId !== taskId))
    setSelectedTaskIds((prev: Set<string>) => {
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

  const handleClearForm = () => {
    setInputs({ batch: '', single: '' })
    clearPreviewState()
  }

  const selectedPreviewTasks = previewEntries.filter(
    (entry): entry is PreviewEntry & { task: StockOrderTask } =>
      Boolean(entry.task && selectedTaskIds.has(entry.task.taskId)),
  )

  const totalSelectedPoints = selectedPreviewTasks.reduce<number>(
    (sum: number, entry: PreviewEntry & { task: StockOrderTask }) => sum + (entry.task.costPoints ?? 0),
    0,
  )

  const providerCount = sitesQuery.data?.length ?? 0
  const nextPaymentLabel = session?.nextPaymentDue
    ? dateTimeFormatter.format(new Date(session.nextPaymentDue))
    : 'Not scheduled'
  const historyTasks: StockOrderTask[] = tasksQuery.data ?? []

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

      <div className="tab-panel split order-preview-wrapper">
        <Card
          title={isBatchMode ? 'Batch download mode' : 'Single download mode'}
          description={
            isBatchMode
              ? 'Paste up to five asset URLs. We’ll preview costs before you spend any points.'
              : 'Paste a single asset URL. Preview costs before you confirm the download.'
          }
        >
          <>
            <div className="order-mode-toggle">
              <button
                type="button"
                className={isBatchMode ? 'mode-pill mode-pill--active' : 'mode-pill'}
                onClick={() => handleModeChange('batch')}
                disabled={!isAuthenticated}
              >
                Batch download
                <span className="mode-pill__hint">Up to 5 links</span>
              </button>
              <button
                type="button"
                className={isSingleMode ? 'mode-pill mode-pill--active' : 'mode-pill'}
                onClick={() => handleModeChange('single')}
                disabled={!isAuthenticated}
              >
                Single download
                <span className="mode-pill__hint">Exactly 1 link</span>
              </button>
            </div>

            <form className="order-form" onSubmit={handlePreviewSubmit}>
              <Field
                label={isBatchMode ? 'Asset URLs' : 'Asset URL'}
                hint={
                  isBatchMode
                    ? `Paste up to ${MAX_LINKS} URLs, one per line.`
                    : 'Paste a direct asset link. Provider detection runs automatically.'
                }
              >
                {isBatchMode ? (
                  <textarea
                    value={batchInput}
                    onChange={handleBatchInputChange}
                    placeholder={'https://provider.com/path/to/asset\nhttps://provider.com/asset-two'}
                    rows={6}
                    disabled={!isAuthenticated}
                  />
                ) : (
                  <input
                    value={singleInput}
                    onChange={handleSingleInputChange}
                    placeholder="https://provider.com/path/to/asset"
                    autoComplete="off"
                    disabled={!isAuthenticated}
                  />
                )}
              </Field>

              <div className="input-progress">
                <div className="input-progress__bar" aria-hidden>
                  <span style={{ width: `${(totalLinkCount / MAX_LINKS) * 100}%` }} />
                </div>
                <div className="input-progress__counters">
                  <span>{totalLinkCount} / {MAX_LINKS} slots used</span>
                  <span>{isBatchMode ? 'Batch mode' : 'Single mode'}</span>
                </div>
              </div>

              <div className="form-actions order-form__actions">
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

                <div className="form-actions__buttons">
                  <button
                    className="primary order-submit"
                    type="submit"
                    disabled={
                      !isAuthenticated ||
                      previewMutation.isPending ||
                      totalLinkCount === 0 ||
                      (isSingleMode && totalLinkCount !== 1)
                    }
                  >
                    <span className="button-content">
                      {previewMutation.isPending ? <span className="button-spinner" aria-hidden="true" /> : null}
                      {previewMutation.isPending
                        ? 'Previewing…'
                        : isBatchMode
                          ? 'Process batch'
                          : 'Process single'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="secondary order-clear"
                    onClick={handleClearForm}
                    disabled={!isAuthenticated}
                  >
                    Clear
                  </button>

                  {previewEntries.length > 0 ? (
                    <button
                      type="button"
                      className="secondary order-reset"
                      onClick={clearPreviewState}
                      disabled={previewMutation.isPending}
                    >
                      Reset preview
                    </button>
                  ) : null}
                </div>
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

        <div className="order-preview-section">
          <Card
            className="order-preview-card"
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
                <div className="preview-results order-preview-grid">
                  {previewEntries.map((entry: PreviewEntry, index: number) => {
                    if (!entry.task) {
                      return (
                        <Fragment key={`preview-error-${index}`}>
                          <Toast
                            title="Preview failed"
                            message={entry.error ?? 'Unknown error while preparing this asset.'}
                            variant="error"
                          />
                        </Fragment>
                      )
                    }

                    const task = entry.task
                    const isSelected = selectedTaskIds.has(task.taskId)
                    const createdAtLabel = dateTimeFormatter.format(new Date(task.createdAt))
                    const variant = getPreviewVariant(task.status)

                    return (
                      <Fragment key={task.taskId}>
                        <PreviewTaskCard
                          task={task}
                          costLabel={formatCost(task)}
                          createdAtLabel={createdAtLabel}
                          isSelected={isSelected}
                          onToggle={() => toggleTaskSelection(task.taskId)}
                          onQueue={() => handleCommitSingle(task.taskId)}
                          onRemove={() => removePreviewTask(task.taskId)}
                          selectionDisabled={commitMutation.isPending}
                          queueDisabled={commitMutation.isPending}
                          removeDisabled={commitMutation.isPending}
                          variant={variant}
                        />
                      </Fragment>
                    )
                  })}
                </div>
              )}

              {previewEntries.some((entry: PreviewEntry) => entry.task) ? (
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

          <OrderSummaryPanel
            selectedCount={selectedTaskIds.size}
            totalTasks={previewEntries.filter((entry: PreviewEntry): entry is PreviewEntry & { task: StockOrderTask } => Boolean(entry.task)).length}
            totalSelectedPoints={totalSelectedPoints}
            availablePoints={balanceQuery.data?.points ?? 0}
            remainingPoints={Math.max((balanceQuery.data?.points ?? 0) - totalSelectedPoints, 0)}
            isConfirming={commitMutation.isPending}
            hasInsufficientPoints={Boolean(balanceQuery.data && totalSelectedPoints > (balanceQuery.data?.points ?? 0))}
            onConfirm={handleConfirmSelected}
            onClearSelection={() => setSelectedTaskIds(new Set())}
            disableConfirm={selectedTaskIds.size === 0 || commitMutation.isPending}
            disableClear={selectedTaskIds.size === 0 || commitMutation.isPending}
          />
        </div>
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