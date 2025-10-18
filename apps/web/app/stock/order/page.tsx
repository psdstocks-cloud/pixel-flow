'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, Field, StatusBadge, Toast } from '../../../components'
import {
  createOrder,
  fetchSites,
  getOrderStatus,
  queries,
  type StockOrderPayload,
  type StockOrderResponse,
  type StockSite,
  type StockStatusResponse,
  detectSiteAndIdFromUrl,
  buildDownloadUrl,
} from '../../../lib/stock'

type FormValues = {
  site: string
  id: string
  url: string
  responsetype: NonNullable<StockOrderPayload['responsetype']>
  notificationChannel: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

type LatestResult =
  | { status: 'success'; response: StockOrderResponse }
  | { status: 'error'; message: string }
  | null

const initialFormValues: FormValues = {
  site: '',
  id: '',
  url: '',
  responsetype: 'any',
  notificationChannel: '',
}

function isSuccessResult(
  result: LatestResult,
): result is { status: 'success'; response: StockOrderResponse } {
  return Boolean(result && result.status === 'success')
}

function isErrorResult(result: LatestResult): result is { status: 'error'; message: string } {
  return Boolean(result && result.status === 'error')
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidNotificationChannel(value: string) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return isValidHttpUrl(value) || emailPattern.test(value)
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  const site = values.site.trim()
  const id = values.id.trim()
  const url = values.url.trim()
  const notification = values.notificationChannel.trim()
  const hasUrl = url.length > 0
  const hasSite = site.length > 0
  const hasId = id.length > 0

  if (!hasUrl && !(hasSite && hasId)) {
    const message = 'Provide a direct URL or supply both site and asset ID.'
    errors.url = message
    errors.site = message
    errors.id = message
  } else {
    if (hasSite && !hasId) errors.id = 'An asset ID is required when a site is selected.'
    if (hasId && !hasSite) errors.site = 'Select a site when providing an asset ID.'
  }

  if (hasUrl && !isValidHttpUrl(url)) {
    errors.url = 'Enter a valid URL starting with http:// or https://.'
  }

  if (notification && !isValidNotificationChannel(notification)) {
    errors.notificationChannel = 'Provide a valid webhook URL or email address.'
  }

  return errors
}

type BulkOrderResult = {
  url: string
  status: 'success' | 'error'
  message: string
  taskId?: string
}

export default function StockOrderPage() {
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [latestResult, setLatestResult] = useState<LatestResult>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [pollingEnabled, setPollingEnabled] = useState(false)
  const [statusSnapshot, setStatusSnapshot] = useState<StockStatusResponse | null>(null)
  const [bulkInput, setBulkInput] = useState('')
  const [bulkResponseType, setBulkResponseType] = useState<FormValues['responsetype']>('any')
  const [bulkNotificationChannel, setBulkNotificationChannel] = useState('')
  const [bulkResults, setBulkResults] = useState<BulkOrderResult[]>([])
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'providers'>('single')

  const sitesQuery = useQuery({
    queryKey: queries.sites,
    queryFn: ({ signal }) => fetchSites(signal),
    staleTime: 5 * 60 * 1000,
  })

  const sites = useMemo<StockSite[]>(() => sitesQuery.data ?? [], [sitesQuery.data])
  const sitesLoading = sitesQuery.isLoading
  const sitesError =
    sitesQuery.isError && sitesQuery.error instanceof Error
      ? sitesQuery.error.message
      : sitesQuery.isError
        ? 'Unable to load stock sites.'
        : null

  const detectionPreview = useMemo(() => {
    const trimmed = formValues.url.trim()
    if (!trimmed) return null
    return detectSiteAndIdFromUrl(trimmed, sites)
  }, [formValues.url, sites])

  const detectionMessage = useMemo(() => {
    const trimmed = formValues.url.trim()
    if (!trimmed) return null
    if (!isValidHttpUrl(trimmed)) return 'Enter a valid URL to enable auto-detection.'
    if (!detectionPreview) return 'Provider detection unavailable for this URL.'
    return null
  }, [formValues.url, detectionPreview])

  useEffect(() => {
    if (!detectionPreview) return
    setFormValues((prev) => {
      let changed = false
      const next = { ...prev }
      if (!prev.site && detectionPreview.site) {
        next.site = detectionPreview.site
        changed = true
      }
      if (!prev.id && detectionPreview.id) {
        next.id = detectionPreview.id
        changed = true
      }
      return changed ? next : prev
    })
  }, [detectionPreview])

  const orderStatusQuery = useQuery<StockStatusResponse>({
    queryKey: activeTaskId ? queries.orderStatus(activeTaskId) : ['stock', 'order', 'status', 'idle'],
    queryFn: ({ signal }) => {
      if (!activeTaskId) throw new Error('No task to poll.')
      return getOrderStatus(activeTaskId, undefined, signal)
    },
    enabled: Boolean(activeTaskId) && pollingEnabled,
    refetchInterval: pollingEnabled ? 5000 : false,
    refetchOnWindowFocus: false,
  })

  const statusData = orderStatusQuery.data
  const statusError =
    orderStatusQuery.isError && orderStatusQuery.error instanceof Error
      ? orderStatusQuery.error.message
      : orderStatusQuery.isError
        ? 'Unable to refresh order status.'
        : null
  const isStatusLoading = pollingEnabled && orderStatusQuery.isLoading
  const isStatusFetching = orderStatusQuery.isFetching

  useEffect(() => {
    if (!statusData) return
    setStatusSnapshot(statusData)
    const normalized = typeof statusData.status === 'string' ? statusData.status.toLowerCase() : ''
    const terminalStatuses = new Set(['completed', 'failed', 'cancelled', 'canceled', 'error'])
    if (terminalStatuses.has(normalized)) {
      setPollingEnabled(false)
    }
  }, [statusData])

  const createOrderMutation = useMutation({
    mutationFn: async (payload: StockOrderPayload) => createOrder(payload),
    onMutate: () => {
      setLatestResult(null)
      setActiveTaskId(null)
      setPollingEnabled(false)
      setStatusSnapshot(null)
    },
    onSuccess: (data) => {
      setLatestResult({ status: 'success', response: data })
      setFormErrors({})
      setFormValues(initialFormValues)
      setActiveTaskId(data.taskId ?? null)
      setStatusSnapshot(null)
      setPollingEnabled(Boolean(data.taskId))
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to queue the stock order.'
      setLatestResult({ status: 'error', message })
      setActiveTaskId(null)
      setPollingEnabled(false)
      setStatusSnapshot(null)
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedValues: FormValues = {
      site: formValues.site.trim(),
      id: formValues.id.trim(),
      url: formValues.url.trim(),
      responsetype: formValues.responsetype,
      notificationChannel: formValues.notificationChannel.trim(),
    }
    const nextErrors = validate(trimmedValues)
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload: StockOrderPayload = {
      site: trimmedValues.site || undefined,
      id: trimmedValues.id || undefined,
      url: trimmedValues.url || undefined,
      responsetype: trimmedValues.responsetype,
      notificationChannel: trimmedValues.notificationChannel || undefined,
    }

    createOrderMutation.mutate(payload)
  }

  const latestSuccess = isSuccessResult(latestResult) ? latestResult.response : null
  const latestError = isErrorResult(latestResult) ? latestResult : null

  const currentStatus = (statusSnapshot?.status ?? latestSuccess?.status ?? 'queued') as string
  const currentMessage = (() => {
    if (statusSnapshot && typeof statusSnapshot.message === 'string') return statusSnapshot.message
    if (latestSuccess && typeof latestSuccess.message === 'string') return latestSuccess.message
    return undefined
  })()
  const currentProgress =
    statusSnapshot && typeof statusSnapshot.progress === 'number'
      ? statusSnapshot.progress
      : undefined
  const currentDownloadUrl = statusSnapshot?.downloadUrl as string | undefined
  const downloadHref = (() => {
    const taskId = activeTaskId ?? latestSuccess?.taskId
    if (!taskId) return undefined
    if (currentDownloadUrl) return currentDownloadUrl
    if ((statusSnapshot?.status ?? latestSuccess?.status) === 'ready') {
      return buildDownloadUrl(taskId, formValues.responsetype)
    }
    return undefined
  })()
  const queuedAt = latestSuccess?.queuedAt ? new Date(latestSuccess.queuedAt).toLocaleString() : null
  const lastUpdated = statusSnapshot
    ? new Date(orderStatusQuery.dataUpdatedAt || Date.now()).toLocaleString()
    : queuedAt

  const showStatusPanel = Boolean(activeTaskId || statusSnapshot || latestSuccess)
  const normalizedStatus = (currentStatus ?? 'queued').toLowerCase()
  const statusAliases: Record<string, string> = {
    pending: 'queued',
    queued: 'queued',
    running: 'processing',
    processing: 'processing',
    inprogress: 'processing',
    ready: 'ready',
    completed: 'completed',
    success: 'completed',
  }
  const resolvedStatus = statusAliases[normalizedStatus] ?? normalizedStatus
  const isErrorStatus = ['failed', 'error', 'cancelled', 'canceled'].includes(normalizedStatus)
  const timelineSteps = [
    {
      key: 'queued',
      title: 'Queued',
      description: 'We registered your order and queued it with the provider.',
    },
    {
      key: 'processing',
      title: 'Processing',
      description: 'The provider is gathering the asset and validating access.',
    },
    {
      key: 'ready',
      title: 'Ready',
      description: 'Download link is ready whenever you are.',
    },
    {
      key: 'completed',
      title: 'Completed',
      description: 'The asset has been delivered successfully.',
    },
  ] as const
  const processingIndex = timelineSteps.findIndex((step) => step.key === 'processing')
  const timelineActiveIndex = (() => {
    if (isErrorStatus) return processingIndex >= 0 ? processingIndex : 0
    const idx = timelineSteps.findIndex((step) => step.key === resolvedStatus)
    return idx >= 0 ? idx : 0
  })()
  const progressValue =
    typeof currentProgress === 'number' ? Math.round(Math.max(0, Math.min(100, currentProgress))) : null
  const activeTaskLabel = activeTaskId ?? latestSuccess?.taskId ?? null
  const providerCount = sites.length

  const tabs = [
    {
      key: 'single' as const,
      label: 'Single order',
      summary: 'Queue and monitor individual downloads.',
    },
    {
      key: 'bulk' as const,
      label: 'Bulk order',
      summary: 'Submit multiple URLs with shared settings.',
    },
    {
      key: 'providers' as const,
      label: 'Providers',
      summary: 'Check pricing and availability.',
    },
  ]

  const handleBulkSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const lines = bulkInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const notification = bulkNotificationChannel.trim()
    if (notification && !isValidNotificationChannel(notification)) {
      setBulkResults([
        {
          url: 'Notification channel',
          status: 'error',
          message: 'Provide a valid webhook URL or email address for bulk orders.',
        },
      ])
      return
    }

    if (lines.length === 0) {
      setBulkResults([
        { url: 'Bulk queue', status: 'error', message: 'Add at least one URL to queue.' },
      ])
      return
    }

    setBulkSubmitting(true)
    const results: BulkOrderResult[] = []

    for (const rawUrl of lines) {
      const trimmedUrl = rawUrl.trim()
      const detection = detectSiteAndIdFromUrl(trimmedUrl, sites)
      const url = isValidHttpUrl(trimmedUrl) ? trimmedUrl : undefined
      const site = detection?.site
      const id = detection?.id

      if (!url && !(site && id)) {
        results.push({
          url: rawUrl,
          status: 'error',
          message: 'Could not detect provider. Add site and ID manually.',
        })
        continue
      }

      try {
        const response = await createOrder({
          url,
          site,
          id,
          responsetype: bulkResponseType,
          notificationChannel: notification || undefined,
        })
        results.push({
          url: rawUrl,
          status: 'success',
          message: response.message ?? 'Queued.',
          taskId: response.taskId,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to queue order.'
        results.push({ url: rawUrl, status: 'error', message })
      }
    }

    setBulkResults(results)
    setBulkSubmitting(false)
  }

  return (
    <main>
      <section className="order-hero">
        <span className="hero-badge">Stock workflow</span>
        <h1>Download stock assets in a glass-smooth flow.</h1>
        <p className="hero-description">
          Queue single or bulk orders, track real-time status, and fetch downloads without leaving the dashboard.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span className="glass-chip">Providers live: {providerCount}</span>
          <span className="glass-chip">Auto-detect URLs</span>
          <span className="glass-chip">Choose CDN mirror</span>
        </div>
      </section>

      <div className="tab-nav" role="tablist" aria-label="Stock order sections">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={['tab-button', activeTab === tab.key ? 'active' : ''].filter(Boolean).join(' ')}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span>{tab.summary}</span>
          </button>
        ))}
      </div>

      {activeTab === 'single' ? (
        <div className="tab-panel split" role="tabpanel">
          <Card title="Single order" description="Queue a stock asset and configure delivery preferences.">
            <>
              <form className="form-grid" onSubmit={handleSubmit}>
                <Field label="Provider" hint="Select a stock provider." error={formErrors.site}>
                  <select
                    value={formValues.site}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, site: event.target.value }))}
                    disabled={sitesLoading}
                  >
                    <option value="">Select a provider</option>
                    {sites.map((site) => (
                      <option key={site.site} value={site.site}>
                        {site.displayName ?? site.site}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Asset ID"
                  hint="The identifier used by the stock provider (e.g. 123456789)."
                  error={formErrors.id}
                >
                  <input
                    value={formValues.id}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, id: event.target.value }))}
                    placeholder="e.g. 123456789"
                    autoComplete="off"
                  />
                </Field>

                <Field
                  label="Direct URL"
                  hint={detectionMessage ?? 'Alternative to site + ID. Paste the full asset URL.'}
                  error={formErrors.url}
                >
                  <input
                    value={formValues.url}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, url: event.target.value }))}
                    placeholder="https://example.com/asset"
                    autoComplete="off"
                  />
                </Field>

                <Field label="Response type" hint="Prefer a specific delivery destination?">
                  <select
                    value={formValues.responsetype}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        responsetype: event.target.value as FormValues['responsetype'],
                      }))
                    }
                  >
                    <option value="any">Any (auto)</option>
                    <option value="gdrive">Google Drive</option>
                    <option value="asia">Asia CDN</option>
                    <option value="mydrivelink">My Drive Link</option>
                  </select>
                </Field>

                <Field
                  label="Notification channel"
                  hint="Optional webhook or email for completion updates."
                  error={formErrors.notificationChannel}
                >
                  <input
                    value={formValues.notificationChannel}
                    onChange={(event) =>
                      setFormValues((prev) => ({ ...prev, notificationChannel: event.target.value }))
                    }
                    placeholder="https://hooks.slack.com/... or email@example.com"
                    autoComplete="off"
                  />
                </Field>

                <div className="form-actions">
                  <button className="primary" type="submit" disabled={createOrderMutation.isPending}>
                    <span className="button-content">
                      {createOrderMutation.isPending ? (
                        <span className="button-spinner" aria-hidden="true" />
                      ) : null}
                      {createOrderMutation.isPending ? 'Submitting…' : 'Queue order'}
                    </span>
                  </button>
                  {detectionPreview ? (
                    <span className="glass-chip" aria-live="polite">
                      Suggested: {detectionPreview.site}
                      {detectionPreview.id ? ` · ${detectionPreview.id}` : ''}
                    </span>
                  ) : null}
                </div>
              </form>

              {sitesLoading ? (
                <Toast title="Loading providers" message="Fetching sites from the API." variant="info" />
              ) : null}
              {sitesError ? (
                <Toast title="Could not load providers" message={sitesError} variant="error" />
              ) : null}
            </>
          </Card>

          <Card
            title="Task status"
            description="Monitor progress, download results, and review recent activity."
            headerSlot={
              activeTaskLabel ? <span className="glass-chip">Task {activeTaskLabel.slice(0, 10)}…</span> : null
            }
          >
            {latestError ? (
              <Toast title="Could not queue order" message={latestError.message} variant="error" />
            ) : showStatusPanel ? (
              <>
                <div className="status-badge-row">
                  <StatusBadge status={resolvedStatus ?? 'queued'} />
                  {pollingEnabled || isStatusFetching ? (
                    <span className="polling-indicator" title="Polling for updates" aria-hidden="true" />
                  ) : null}
                  <div className="status-meta">
                    {activeTaskLabel ? <span>Task ID: {activeTaskLabel}</span> : null}
                    {queuedAt ? <span>Queued: {queuedAt}</span> : null}
                    {lastUpdated ? <span>Last update: {lastUpdated}</span> : null}
                  </div>
                </div>

                {currentMessage ? <p style={{ margin: 0 }}>{currentMessage as string}</p> : null}

                {typeof progressValue === 'number' ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: `${progressValue}%`,
                          borderRadius: 999,
                          background:
                            'linear-gradient(90deg, rgba(56, 189, 248, 0.85), rgba(168, 85, 247, 0.8))',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--pf-text-subtle)' }}>{progressValue}%</span>
                  </div>
                ) : null}

                {downloadHref ? (
                  <a
                    href={downloadHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-button"
                  >
                    Download latest files
                  </a>
                ) : null}

                <div className="status-timeline">
                  {timelineSteps.map((step, index) => {
                    const isReached = index <= timelineActiveIndex
                    const indicatorClassName = ['status-indicator', isReached ? 'active' : ''].filter(Boolean).join(' ')
                    const tone = isErrorStatus && index >= timelineActiveIndex ? 'var(--pf-error)' : undefined
                    return (
                      <div className="status-step" key={step.key}>
                        <div
                          className={indicatorClassName}
                          style={tone ? { borderColor: tone, boxShadow: `0 0 14px ${tone}`, background: tone } : undefined}
                        />
                        <div className="status-content">
                          <strong>{step.title}</strong>
                          <span>{step.description}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="status-actions">
                  {pollingEnabled ? (
                    <button type="button" className="secondary" onClick={() => setPollingEnabled(false)}>
                      Pause polling
                    </button>
                  ) : null}
                  {activeTaskId ? (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        if (!activeTaskId) return
                        if (!pollingEnabled) setPollingEnabled(true)
                        orderStatusQuery.refetch()
                      }}
                      disabled={isStatusFetching}
                    >
                      <span className="button-content">
                        {isStatusFetching ? <span className="button-spinner" aria-hidden="true" /> : null}
                        {isStatusFetching ? 'Refreshing…' : pollingEnabled ? 'Poll now' : 'Refresh status'}
                      </span>
                    </button>
                  ) : null}
                </div>

                {isStatusLoading ? (
                  <Toast title="Refreshing status" message="Polling the task for updates." variant="info" />
                ) : null}
                {!pollingEnabled && activeTaskId ? (
                  <Toast
                    title="Polling paused"
                    message="Automatic updates are paused after reaching a final state. Use refresh to check again."
                    variant="info"
                  />
                ) : null}
                {statusError ? <Toast title="Status unavailable" message={statusError} variant="error" /> : null}
              </>
            ) : latestSuccess ? (
              <>
                <div className="status-badge-row">
                  <StatusBadge status={latestSuccess.status ?? 'queued'} />
                  <div className="status-meta">
                    {latestSuccess.taskId ? <span>Task ID: {latestSuccess.taskId}</span> : null}
                    {queuedAt ? <span>Queued: {queuedAt}</span> : null}
                  </div>
                </div>
                {latestSuccess.message ? <p style={{ margin: 0 }}>{latestSuccess.message}</p> : null}
                <Toast title="Order queued" message="Waiting for the first status update." variant="success" />
              </>
            ) : (
              <p style={{ color: 'var(--pf-text-subtle)', margin: 0 }}>
                Queue a stock order to start tracking status updates.
              </p>
            )}
          </Card>
        </div>
      ) : null}

      {activeTab === 'bulk' ? (
        <div className="tab-panel single" role="tabpanel">
          <Card
            title="Bulk queue"
            description="Submit multiple asset URLs in one go. We’ll auto-detect supported providers when possible."
          >
            <>
              <form className="form-grid" onSubmit={handleBulkSubmit}>
                <Field label="Asset URLs" hint="Enter one URL per line.">
                  <textarea
                    value={bulkInput}
                    onChange={(event) => setBulkInput(event.target.value)}
                    rows={6}
                    placeholder={'https://example.com/asset-1\nhttps://example.com/asset-2'}
                    style={{ resize: 'vertical' }}
                  />
                </Field>

                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <Field label="Response type">
                    <select
                      value={bulkResponseType}
                      onChange={(event) => setBulkResponseType(event.target.value as FormValues['responsetype'])}
                    >
                      <option value="any">Any (auto)</option>
                      <option value="gdrive">Google Drive</option>
                      <option value="asia">Asia CDN</option>
                      <option value="mydrivelink">My Drive Link</option>
                    </select>
                  </Field>

                  <Field label="Notification channel" hint="Optional email or webhook for all queued tasks.">
                    <input
                      value={bulkNotificationChannel}
                      onChange={(event) => setBulkNotificationChannel(event.target.value)}
                      placeholder="https://hooks.slack.com/... or email@example.com"
                      autoComplete="off"
                    />
                  </Field>
                </div>

                <div className="form-actions">
                  <button type="submit" className="primary" disabled={bulkSubmitting}>
                    <span className="button-content">
                      {bulkSubmitting ? <span className="button-spinner" aria-hidden="true" /> : null}
                      {bulkSubmitting ? 'Queueing…' : 'Queue all URLs'}
                    </span>
                  </button>
                  <span className="glass-chip">Up to 5 URLs per batch</span>
                </div>
              </form>

              {bulkResults.length > 0 ? (
                <div className="bulk-results" aria-live="polite">
                  {bulkResults.map((result) => (
                    <div
                      className="bulk-result-card"
                      key={`${result.url}-${result.message}-${result.status}-${result.taskId ?? 'none'}`}
                    >
                      <div className="bulk-result-header">
                        <span
                          className={`bulk-result-icon ${result.status === 'success' ? 'success' : 'error'}`}
                          aria-hidden="true"
                        >
                          {result.status === 'success' ? '✓' : '✕'}
                        </span>
                        <strong>{result.url}</strong>
                      </div>
                      <span style={{ color: 'var(--pf-text-muted)' }}>{result.message}</span>
                      {result.taskId ? <span className="status-meta">Task ID: {result.taskId}</span> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          </Card>
        </div>
      ) : null}

      {activeTab === 'providers' ? (
        <div className="tab-panel single" role="tabpanel">
          <Card title="Provider pricing" description="Live availability and point cost per provider.">
            {sitesLoading ? (
              <Toast title="Loading pricing" message="Fetching provider catalog." variant="info" />
            ) : sitesError ? (
              <Toast title="Unavailable" message={sitesError} variant="error" />
            ) : sites.length === 0 ? (
              <p style={{ color: 'var(--pf-text-subtle)', margin: 0 }}>No providers are currently configured.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {sites.map((site) => {
                  const priceDisplay =
                    site.price != null ? `${site.price}${site.currency ? ` ${site.currency}` : ''}` : '—'
                  return (
                    <div
                      key={site.site}
                      className="bulk-result-card"
                      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
                    >
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
            )}
          </Card>
        </div>
      ) : null}
    </main>
  )
}

