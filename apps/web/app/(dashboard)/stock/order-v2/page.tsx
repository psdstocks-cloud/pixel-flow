'use client'

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  Field,
  OrderSummaryPanel,
  Toast,
  useNotifications,
} from '../../../../components'
import {
  commitOrder,
  detectSiteAndIdFromUrl,
  fetchBalance,
  fetchSites,
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
const DEFAULT_RESPONSE_TYPE: ResponseType = 'any'

const RESPONSE_OPTIONS: Array<{ value: ResponseType; label: string }> = [
  { value: 'any', label: 'Any (auto)' },
  { value: 'gdrive', label: 'Google Drive' },
  { value: 'asia', label: 'Asia CDN' },
  { value: 'mydrivelink', label: 'My Drive Link' },
]

type OrderMode = 'batch' | 'single'
type OrderInputs = { batch: string; single: string }
type PreviewEntry = PreviewOrderResponse['results'][number]
type Feedback = { type: 'success' | 'error'; message: string }

type PreviewStats = {
  total: number
  ready: number
  errors: number
  pending: number
  totalPoints: number
}

function computeStats(entries: PreviewEntry[]): PreviewStats {
  return entries.reduce<PreviewStats>((acc, entry) => {
    acc.total += 1
    if (!entry.task) {
      acc.errors += 1
      return acc
    }

    const status = entry.task.status?.toLowerCase() ?? 'unknown'
    if (status === 'ready' || status === 'success' || status === 'completed') {
      acc.ready += 1
      acc.totalPoints += entry.task.costPoints ?? 0
    } else if (status === 'error' || status === 'failed' || status === 'cancelled') {
      acc.errors += 1
    } else {
      acc.pending += 1
    }

    return acc
  }, { total: 0, ready: 0, errors: 0, pending: 0, totalPoints: 0 })
}

function getStatusLabel(entry: PreviewEntry) {
  if (!entry.task) return { label: 'Unable to preview', tone: 'error' as const }
  const status = entry.task.status?.toLowerCase() ?? 'unknown'
  if (status === 'ready' || status === 'success' || status === 'completed') {
    return { label: 'Ready for download', tone: 'primary' as const }
  }
  if (status === 'error' || status === 'failed' || status === 'cancelled') {
    return { label: entry.error ?? 'Unable to process asset', tone: 'error' as const }
  }
  return { label: 'Processing preview…', tone: 'secondary' as const }
}

function formatCost(task: StockOrderTask | undefined) {
  if (!task) return '—'
  if (task.costPoints != null) return `${task.costPoints} pts`
  if (task.costAmount != null && task.costCurrency) return `${task.costAmount} ${task.costCurrency}`
  return '—'
}

export default function StockOrderPageV2() {
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

  const batchLinks = useMemo<string[]>(() => {
    return inputs.batch
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, MAX_LINKS)
  }, [inputs.batch])

  const singleLink = useMemo(() => inputs.single.trim(), [inputs.single])

  const activeLinks = useMemo<string[]>(() => {
    if (isBatchMode) return batchLinks
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

  const detectionHints = useMemo(() => activeLinks.map((link) => detectSiteAndIdFromUrl(link)), [activeLinks])

  const previewMutation = useMutation({
    mutationFn: (payload: PreviewOrderPayload) => previewOrder(payload),
    onSuccess: (data) => {
      setPreviewEntries(data.results)
      setSelectedTaskIds(() => {
        const next = new Set<string>()
        data.results.forEach((result) => {
          if (!result.task) return
          const status = result.task.status?.toLowerCase() ?? 'unknown'
          if (status === 'ready' || status === 'success' || status === 'completed') {
            next.add(result.task.taskId)
          }
        })
        return next
      })
      setPreviewFeedback({
        type: data.results.some((result) => result.task) ? 'success' : 'error',
        message: data.results.some((result) => result.task)
          ? 'Preview complete. Review the results below.'
          : 'No preview tasks were created. Verify the URLs and try again.',
      })
      setCommitFeedback(null)
      if (userId) {
        queryClient.setQueryData(queries.balance(userId), data.balance)
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to preview links. Please try again.'
      setPreviewFeedback({ type: 'error', message })
      notify({ title: 'Preview failed', message, variant: 'error' })
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
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Unable to queue the selected orders.')
          : error instanceof Error
            ? error.message
            : 'Unable to queue the selected orders.'
      setCommitFeedback({ type: 'error', message })
      notify({ title: 'Unable to queue orders', message, variant: 'error' })
    },
  })

  const clearPreviewState = () => {
    setPreviewEntries([])
    setSelectedTaskIds(new Set())
    setPreviewFeedback(null)
    setCommitFeedback(null)
  }

  const setBatchInput = (value: string | ((prev: string) => string)) => {
    setInputs((prev) => {
      const next = typeof value === 'function' ? value(prev.batch) : value
      return { ...prev, batch: next }
    })
  }

  const setSingleInput = (value: string | ((prev: string) => string)) => {
    setInputs((prev) => {
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

    activeLinks.forEach((link, index) => {
      const trimmed = link.trim()
      if (!trimmed) return
      if (!uniqueItems.has(trimmed)) {
        const detection = detectionHints[index]
        uniqueItems.set(trimmed, {
          url: trimmed,
          site: detection?.site,
          id: detection?.id,
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
    commitMutation.mutate({ userId, taskIds, responsetype: responseType })
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

  const handleAddExamples = () => {
    if (isBatchMode) {
      setBatchInput(
        [
          'https://www.shutterstock.com/image-photo/example-asset-1',
          'https://www.istockphoto.com/vector/example-asset-2',
          'site:id',
        ].join('\n'),
      )
    } else {
      setSingleInput('https://www.shutterstock.com/image-photo/example-asset-1')
    }
  }

  const stats = useMemo(() => computeStats(previewEntries), [previewEntries])

  const detectedSites = useMemo(() => {
    const seen = new Set<string>()
    detectionHints.forEach((hint, index) => {
      const url = activeLinks[index]
      let label = hint?.site
      if (!label && url) {
        try {
          label = new URL(url).hostname.replace(/^www\./, '')
        } catch {
          label = undefined
        }
      }
      if (label) seen.add(label)
    })
    return Array.from(seen)
  }, [activeLinks, detectionHints])

  const selectedPreviewTasks = previewEntries.filter(
    (entry): entry is PreviewEntry & { task: StockOrderTask } =>
      Boolean(entry.task && selectedTaskIds.has(entry.task.taskId)),
  )

  const totalSelectedPoints = selectedPreviewTasks.reduce((sum, entry) => sum + (entry.task.costPoints ?? 0), 0)

  const showSignInWarning = sessionStatus === 'ready' && !isAuthenticated

  return (
    <main className="order-v2">
      <section className="order-v2__hero">
        <div className="order-v2__hero-text">
          <span className="order-v2__badge">Stock Downloader</span>
          <h1 className="order-v2__title">Batch stock search and downloads in one place.</h1>
          <p className="order-v2__subtitle">
            Paste up to five stock URLs or IDs, preview pricing instantly, and confirm only the assets you need.
          </p>
        </div>
        <div className="order-v2__mode-toggle" role="tablist" aria-label="Order mode">
          <button
            type="button"
            role="tab"
            aria-selected={isBatchMode}
            className={`order-v2__mode ${isBatchMode ? 'order-v2__mode--active' : ''}`}
            onClick={() => handleModeChange('batch')}
            disabled={!isAuthenticated}
          >
            Batch Download
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isBatchMode}
            className={`order-v2__mode ${!isBatchMode ? 'order-v2__mode--active' : ''}`}
            onClick={() => handleModeChange('single')}
            disabled={!isAuthenticated}
          >
            Single Download
          </button>
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

      <div className="order-v2__layout">
        <div className="order-v2__column">
          <Card className="order-v2__card" title="Input stock items" description="Paste your stock URLs or IDs to preview costs.">
            <>
              <div className="order-v2__card-actions">
                <button type="button" className="order-v2__ghost" onClick={handleAddExamples} disabled={!isAuthenticated}>
                  + Add examples
                </button>
                <button type="button" className="order-v2__ghost" onClick={handleClearForm} disabled={!isAuthenticated}>
                  Clear inputs
                </button>
              </div>

              <form className="order-v2__form" onSubmit={handlePreviewSubmit}>
                <Field
                  label={isBatchMode ? 'Paste up to five URLs' : 'Paste a single URL'}
                  hint={`Total: ${totalLinkCount} / ${MAX_LINKS}`}
                >
                  {isBatchMode ? (
                    <textarea
                      value={inputs.batch}
                      onChange={handleBatchInputChange}
                      placeholder={'https://provider.com/path/to/asset\nhttps://provider.com/asset-two'}
                      rows={7}
                      disabled={!isAuthenticated}
                    />
                  ) : (
                    <input
                      value={inputs.single}
                      onChange={handleSingleInputChange}
                      placeholder="https://provider.com/path/to/asset"
                      autoComplete="off"
                      disabled={!isAuthenticated}
                    />
                  )}
                </Field>

                <div className="order-v2__form-footer">
                  <div className="order-v2__meta">
                    <span>
                      <strong>{totalLinkCount}</strong> / {MAX_LINKS} items
                    </span>
                    <span>Detected sites: {detectedSites.length > 0 ? detectedSites.join(', ') : '—'}</span>
                  </div>

                  <div className="order-v2__buttons">
                    <label className="order-v2__select">
                      <span>Delivery type</span>
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
                    </label>
                    <button
                      type="submit"
                      className="order-v2__primary"
                      disabled={
                        !isAuthenticated ||
                        previewMutation.isPending ||
                        totalLinkCount === 0 ||
                        (!isBatchMode && totalLinkCount !== 1)
                      }
                    >
                      {previewMutation.isPending ? 'Processing…' : isBatchMode ? 'Process batch' : 'Process single'}
                    </button>
                  </div>
                </div>
              </form>

              {previewFeedback ? (
                <div className={`order-v2__notice order-v2__notice--${previewFeedback.type}`}>
                  <strong>{previewFeedback.type === 'success' ? 'Preview complete' : 'Preview failed'}</strong>
                  <span>{previewFeedback.message}</span>
                </div>
              ) : null}
            </>
          </Card>

          <Card
            className="order-v2__card"
            title="Search results"
            description="Review detected assets, errors, and confirm when ready."
            headerSlot={
              <div className="order-v2__stats">
                <span>Total {stats.total}</span>
                <span>Ready {stats.ready}</span>
                <span>Errors {stats.errors}</span>
                <span>Cost {stats.totalPoints} pts</span>
              </div>
            }
          >
            <>
              {previewEntries.length === 0 ? (
                <p className="order-v2__empty">Run a preview to see results here.</p>
              ) : (
                <div className="order-v2__results">
                  {previewEntries.map((entry, index) => {
                    if (!entry.task) {
                      return (
                        <article key={`error-${index}`} className="order-v2__result order-v2__result--error">
                          <div>
                            <h3>Query not found</h3>
                            {activeLinks[index] ? <p>{activeLinks[index]}</p> : null}
                            {entry.error ? <p>{entry.error}</p> : null}
                          </div>
                          <button
                            type="button"
                            className="order-v2__ghost"
                            onClick={() => removePreviewTask(`error-${index}`)}
                            disabled={commitMutation.isPending}
                          >
                            Remove
                          </button>
                        </article>
                      )
                    }

                    const task = entry.task
                    const statusInfo = getStatusLabel(entry)
                    const statusTone = statusInfo.tone
                    const statusLabel = statusInfo.label
                    const isSelected = selectedTaskIds.has(task.taskId)
                    const thumbnail = task.thumbnailUrl ?? task.previewUrl ?? undefined
                    const title = task.title ?? task.assetId ?? task.sourceUrl
                    const assetId = task.assetId ?? task.externalTaskId ?? null
                    const createdLabel = new Date(task.createdAt).toLocaleString()

                    return (
                      <article
                        key={task.taskId}
                        className={`order-v2__result order-v2__result--${statusTone}${
                          isSelected ? ' order-v2__result--selected' : ''
                        }`}
                      >
                        <div className="order-v2__result-media" aria-hidden="true">
                          {thumbnail ? (
                            <Image src={thumbnail} alt="" fill className="order-v2__result-image" sizes="96px" />
                          ) : (
                            <div className="order-v2__result-placeholder">
                              <span>{(task.site ?? 'U')[0]?.toUpperCase()}</span>
                            </div>
                          )}
                        </div>

                        <div className="order-v2__result-main">
                          <div className="order-v2__result-head">
                            <div className="order-v2__result-heading">
                              <span className="order-v2__result-title">{title}</span>
                              <span className="order-v2__result-site">{task.site ?? 'Unknown provider'}</span>
                            </div>
                            <span className={`order-v2__result-status order-v2__result-status--${statusTone}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <span className="order-v2__result-url">{task.sourceUrl}</span>

                          <div className="order-v2__result-meta">
                            {assetId ? <span>ID: {assetId}</span> : null}
                            <span>Cost: {formatCost(task)}</span>
                            <span>Created: {createdLabel}</span>
                          </div>

                          {task.latestMessage ? (
                            <p className="order-v2__result-message order-v2__result-message--info">{task.latestMessage}</p>
                          ) : null}
                          {entry.error ? (
                            <p className="order-v2__result-message order-v2__result-message--error">{entry.error}</p>
                          ) : null}
                        </div>

                        <div className="order-v2__result-actions">
                          <label className="order-v2__checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTaskSelection(task.taskId)}
                              disabled={statusTone !== 'primary' || commitMutation.isPending}
                            />
                            <span>Select</span>
                          </label>
                          <button
                            type="button"
                            className="order-v2__secondary"
                            onClick={() => handleCommitSingle(task.taskId)}
                            disabled={statusTone !== 'primary' || commitMutation.isPending}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="order-v2__ghost"
                            onClick={() => removePreviewTask(task.taskId)}
                            disabled={commitMutation.isPending}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              {previewEntries.some((entry) => entry.task) ? (
                <footer className="order-v2__results-footer">
                  <div>
                    <strong>{selectedTaskIds.size}</strong> selected · {totalSelectedPoints} pts
                  </div>
                  <button
                    type="button"
                    className="order-v2__primary"
                    onClick={handleConfirmSelected}
                    disabled={selectedTaskIds.size === 0 || commitMutation.isPending}
                  >
                    {commitMutation.isPending ? 'Confirming…' : 'Confirm selected'}
                  </button>
                </footer>
              ) : null}

              {commitFeedback ? (
                <div className={`order-v2__notice order-v2__notice--${commitFeedback.type}`}>
                  <strong>{commitFeedback.type === 'success' ? 'Orders queued' : 'Could not queue orders'}</strong>
                  <span>{commitFeedback.message}</span>
                </div>
              ) : null}
            </>
          </Card>

          <OrderSummaryPanel
            selectedCount={selectedTaskIds.size}
            totalTasks={previewEntries.filter((entry): entry is PreviewEntry & { task: StockOrderTask } => Boolean(entry.task)).length}
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

        <aside className="order-v2__column order-v2__column--sidebar">
          <Card className="order-v2__card" title="Your points" description="Points available for downloads.">
            <>
              {balanceQuery.isLoading ? (
                <p className="order-v2__empty">Checking balance…</p>
              ) : balanceQuery.isError ? (
                <p className="order-v2__empty">Unable to load balance.</p>
              ) : balanceQuery.data ? (
                <div className="order-v2__points">
                  <span className="order-v2__points-value">{balanceQuery.data.points.toLocaleString()}</span>
                  <span className="order-v2__points-caption">points available</span>
                  <Link href="/billing" className="order-v2__primary order-v2__primary--full">
                    Buy more points
                  </Link>
                </div>
              ) : (
                <div className="order-v2__points">
                  <span className="order-v2__points-value">0</span>
                  <span className="order-v2__points-caption">No points yet</span>
                  <Link href="/billing" className="order-v2__primary order-v2__primary--full">
                    View packages
                  </Link>
                </div>
              )}
              <p className="order-v2__hint">All downloads cost 10 points.</p>
            </>
          </Card>

          <Card className="order-v2__card" title="Supported sites" description="Credits per download.">
            <>
              {sitesQuery.isLoading ? (
                <p className="order-v2__empty">Loading providers…</p>
              ) : sitesQuery.isError ? (
                <p className="order-v2__empty">Unable to load providers.</p>
              ) : sitesQuery.data && sitesQuery.data.length > 0 ? (
                <ul className="order-v2__sites">
                  {sitesQuery.data.slice(0, 5).map((site) => (
                    <li key={site.site}>
                      <span className="order-v2__site-name">{site.displayName ?? site.site}</span>
                      <span className="order-v2__site-price">
                        {site.price != null ? `${site.price}${site.currency ? ` ${site.currency}` : ''}` : '1 credit'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="order-v2__empty">No providers configured.</p>
              )}
              <Link href="/stock/providers" className="order-v2__ghost">
                Show all sites
              </Link>
            </>
          </Card>
        </aside>
      </div>
    </main>
  )
}
