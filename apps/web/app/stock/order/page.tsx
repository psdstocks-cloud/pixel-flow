'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Field, StatusBadge, Toast } from '../../../components'
import {
  confirmOrder,
  createOrder,
  fetchSites,
  getOrderStatus,
  queries,
  type StockOrderPayload,
  type StockOrderResponse,
  type StockSite,
  type StockStatusResponse,
  detectSiteAndIdFromUrl,
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

function extractTaskId(response: StockOrderResponse | null | undefined): string | null {
  if (!response || typeof response !== 'object') return null
  const asRecord = response as Record<string, unknown>
  const candidates: Array<unknown> = [
    response.taskId,
    asRecord.task_id,
    response.id,
    asRecord.task,
    typeof asRecord.task === 'object' && asRecord.task !== null ? (asRecord.task as Record<string, unknown>).id : undefined,
    typeof asRecord.task === 'object' && asRecord.task !== null ? (asRecord.task as Record<string, unknown>).taskId : undefined,
    typeof asRecord.result === 'object' && asRecord.result !== null ? (asRecord.result as Record<string, unknown>).taskId : undefined,
    typeof asRecord.result === 'object' && asRecord.result !== null ? (asRecord.result as Record<string, unknown>).id : undefined,
  ]

  for (const candidate of candidates) {
    if (candidate == null) continue
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim()
      if (trimmed.length > 0) return trimmed
    }
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return String(candidate)
    }
  }

  return null
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
      const normalizedTaskId = extractTaskId(data)
      const response = normalizedTaskId && data.taskId !== normalizedTaskId ? { ...data, taskId: normalizedTaskId } : data
      setLatestResult({ status: 'success', response })
      setFormErrors({})
      setFormValues(initialFormValues)
      setActiveTaskId(normalizedTaskId)
      setStatusSnapshot(null)
      setPollingEnabled(Boolean(normalizedTaskId))
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
  const currentFiles = Array.isArray(statusSnapshot?.files)
    ? (statusSnapshot?.files as StockStatusResponse['files'])
    : Array.isArray(latestSuccess?.files)
      ? (latestSuccess?.files as StockStatusResponse['files'])
      : undefined
  const queuedAt = latestSuccess?.queuedAt ? new Date(latestSuccess.queuedAt).toLocaleString() : null
  const lastUpdated = statusSnapshot
    ? new Date(orderStatusQuery.dataUpdatedAt || Date.now()).toLocaleString()
    : queuedAt

  const showStatusPanel = Boolean(activeTaskId || statusSnapshot || latestSuccess)
  const normalizedStatus = currentStatus?.toLowerCase?.() ?? ''
  const hasDownloadArtifacts = Boolean(currentDownloadUrl || (currentFiles && currentFiles.length > 0))
  const shouldShowConfirm = normalizedStatus === 'ready' && hasDownloadArtifacts
  const activeSites = sites.filter((site) => site.active !== false)
  const totalSites = sites.length
  const successfulBulkCount = bulkResults.filter((result) => result.status === 'success').length
  const supportedSiteNames = sites.slice(0, 14).map((site) => site.displayName ?? site.site)

  const panelBaseStyle: CSSProperties = {
    background: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 32,
    border: '1px solid rgba(255, 255, 255, 0.18)',
    padding: '36px clamp(24px, 3vw, 48px)',
    backdropFilter: 'blur(28px)',
    boxShadow: '0 40px 80px rgba(15, 23, 42, 0.35)',
    color: '#f8fafc',
  }

  const inputSurfaceStyle: CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 18,
    border: '1px solid rgba(148, 163, 184, 0.35)',
    background: 'rgba(15, 23, 42, 0.35)',
    color: '#f8fafc',
  }

  const chipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid rgba(255, 255, 255, 0.18)',
    background: 'rgba(148, 163, 184, 0.16)',
    color: '#f8fafc',
    fontSize: 13,
  }

  const primaryButtonStyle: CSSProperties = {
    width: '100%',
    padding: '16px 20px',
    borderRadius: 22,
    border: '1px solid transparent',
    background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
    color: '#f8fafc',
    fontWeight: 600,
    fontSize: 16,
    cursor: createOrderMutation.isPending ? 'not-allowed' : 'pointer',
    boxShadow: '0 24px 45px rgba(99, 102, 241, 0.28)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  }

  const headlineStats = [
    {
      label: 'Active providers',
      value: activeSites.length || totalSites || '—',
    },
    {
      label: 'Bulk successes',
      value: successfulBulkCount,
    },
    {
      label: 'Live task state',
      value: normalizedStatus ? normalizedStatus.toUpperCase() : '—',
    },
  ]

  const handleConfirm = async () => {
    if (!activeTaskId) return
    try {
      const response = await confirmOrder(activeTaskId, { responsetype: formValues.responsetype })
      setStatusSnapshot(response)
      setPollingEnabled(true)
      orderStatusQuery.refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm order.'
      setLatestResult({ status: 'error', message })
    }
  }

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
    let firstSuccessResponse: StockOrderResponse | null = null

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
        const baseMessage = response.message ?? 'Queued.'
        const detectionDetails = site
          ? `Detected provider: ${site}${id ? ` • ID ${id}` : ''}`
          : null
        const normalizedTaskId = extractTaskId(response)
        const enrichedResponse =
          normalizedTaskId && response.taskId !== normalizedTaskId
            ? { ...response, taskId: normalizedTaskId }
            : response
        results.push({
          url: rawUrl,
          status: 'success',
          message: detectionDetails ? `${baseMessage} ${detectionDetails}` : baseMessage,
          taskId: normalizedTaskId ?? response.taskId,
        })
        if (!firstSuccessResponse && normalizedTaskId) {
          firstSuccessResponse = enrichedResponse
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to queue order.'
        results.push({ url: rawUrl, status: 'error', message })
      }
    }

    setBulkResults(results)
    setBulkSubmitting(false)

    if (firstSuccessResponse) {
      const normalizedTaskId = extractTaskId(firstSuccessResponse)
      const response =
        normalizedTaskId && firstSuccessResponse.taskId !== normalizedTaskId
          ? { ...firstSuccessResponse, taskId: normalizedTaskId }
          : firstSuccessResponse
      setLatestResult({ status: 'success', response })
      setActiveTaskId(normalizedTaskId)
    }
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        padding: '88px clamp(24px, 6vw, 120px)',
        background:
          'radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.22), transparent 55%), radial-gradient(circle at 85% 15%, rgba(129, 140, 248, 0.25), transparent 45%), linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-200px auto auto -160px',
          width: 420,
          height: 420,
          background: 'rgba(94, 234, 212, 0.25)',
          filter: 'blur(160px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 'auto -120px -220px auto',
          width: 520,
          height: 520,
          background: 'rgba(129, 140, 248, 0.3)',
          filter: 'blur(200px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', display: 'grid', gap: 40 }}>
        <header style={{ display: 'grid', gap: 20 }}>
          <div
            style={{
              alignSelf: 'start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(18px)',
              fontSize: 14,
              color: 'rgba(226, 232, 255, 0.85)',
              fontWeight: 500,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
            Connected to NEHTW stock network
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
            <div style={{ maxWidth: 620 }}>
              <h1
                style={{
                  fontSize: 'clamp(32px, 4vw, 54px)',
                  lineHeight: 1.1,
                  fontWeight: 700,
                  color: '#f8fafc',
                  margin: 0,
                }}
              >
                Download any stock asset in a single, fluid workflow.
              </h1>
              <p style={{ color: 'rgba(226, 232, 255, 0.78)', margin: '12px 0 0', fontSize: 'clamp(16px, 2vw, 18px)' }}>
                Queue assets from 40+ providers, confirm delivery, and monitor progress in real-time with a glassmorphism experience crafted for 2025.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                minWidth: 260,
              }}
            >
              {headlineStats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: 'rgba(15, 23, 42, 0.38)',
                    borderRadius: 24,
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#f8fafc',
                    backdropFilter: 'blur(22px)',
                  }}
                >
                  <div style={{ fontSize: 15, color: 'rgba(226, 232, 255, 0.68)' }}>{stat.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gap: 32,
            gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 0.9fr)',
            alignItems: 'start',
          }}
        >
          <section style={panelBaseStyle}>
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 'clamp(26px, 3vw, 32px)', fontWeight: 700 }}>Instant download order</h2>
                <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.75)' }}>
                  Paste a stock URL or provide provider credentials. We detect the best route and queue instantly.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
                <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <Field label="Provider" hint="Select a stock provider." htmlFor="stock-provider">
                    <select
                      id="stock-provider"
                      value={formValues.site}
                      onChange={(event) =>
                        setFormValues((prev) => ({ ...prev, site: event.target.value }))
                      }
                      disabled={sitesLoading}
                      style={inputSurfaceStyle}
                    >
                      <option value="">Auto-detect provider</option>
                      {sites.map((site) => (
                        <option key={site.site} value={site.site}>
                          {site.displayName ?? site.site}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Asset ID" hint="Used when the provider requires a unique identifier." htmlFor="stock-asset-id">
                    <input
                      id="stock-asset-id"
                      value={formValues.id}
                      onChange={(event) =>
                        setFormValues((prev) => ({ ...prev, id: event.target.value }))
                      }
                      placeholder="e.g. 123456789"
                      style={inputSurfaceStyle}
                    />
                  </Field>
                </div>

                <Field
                  label="Direct URL"
                  hint={detectionMessage ?? 'Alternative to site + ID. Paste the full asset URL.'}
                  error={formErrors.url}
                  htmlFor="stock-direct-url"
                >
                  <input
                    id="stock-direct-url"
                    value={formValues.url}
                    onChange={(event) =>
                      setFormValues((prev) => ({ ...prev, url: event.target.value }))
                    }
                    placeholder="https://example.com/asset"
                    style={inputSurfaceStyle}
                  />
                </Field>

                <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <Field label="Response type" htmlFor="stock-response-type">
                    <select
                      id="stock-response-type"
                      value={formValues.responsetype}
                      onChange={(event) =>
                        setFormValues((prev) => ({
                          ...prev,
                          responsetype: event.target.value as FormValues['responsetype'],
                        }))
                      }
                      style={inputSurfaceStyle}
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
                    htmlFor="stock-notification-channel"
                  >
                    <input
                      id="stock-notification-channel"
                      value={formValues.notificationChannel}
                      onChange={(event) =>
                        setFormValues((prev) => ({
                          ...prev,
                          notificationChannel: event.target.value,
                        }))
                      }
                      placeholder="https://hooks.slack.com/... or email@example.com"
                      style={inputSurfaceStyle}
                    />
                  </Field>
                </div>

                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  style={{
                    ...primaryButtonStyle,
                    cursor: createOrderMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: createOrderMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {createOrderMutation.isPending ? 'Submitting…' : 'Queue order'}
                </button>

                {sitesLoading ? (
                  <Toast title="Loading sites…" message="Fetching providers from the API." variant="info" />
                ) : null}
                {sitesError ? (
                  <Toast title="Could not load providers" message={sitesError} variant="error" />
                ) : null}
              </form>

              {supportedSiteNames.length ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: 14, color: 'rgba(226, 232, 255, 0.62)', textTransform: 'uppercase', letterSpacing: 1 }}>Popular providers</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {supportedSiteNames.map((name) => (
                      <span key={name} style={chipStyle}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section style={{ ...panelBaseStyle, padding: '32px clamp(22px, 3vw, 44px)', display: 'grid', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(24px, 2.5vw, 30px)', fontWeight: 700 }}>Task timeline</h2>
              <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.7)' }}>
                Follow the lifecycle of your most recent order. Status and downloads update automatically while polling is active.
              </p>
            </div>

            {latestError ? (
              <Toast title="Could not queue order" message={latestError.message} variant="error" />
            ) : showStatusPanel ? (
              <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <StatusBadge status={currentStatus ?? 'queued'} />
                    <div style={{ fontWeight: 600 }}>
                      Task ID: {activeTaskId ?? latestSuccess?.taskId ?? 'Unknown'}
                    </div>
                  </div>
                  {currentMessage ? (
                    <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.8)' }}>{currentMessage}</p>
                  ) : null}
                  {typeof currentProgress === 'number' ? (
                    <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.8)' }}>Progress: {Math.round(currentProgress)}%</p>
                  ) : null}
                  {currentDownloadUrl ? (
                    <a
                      href={currentDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#38bdf8', fontWeight: 600 }}
                    >
                      Download latest files
                    </a>
                  ) : null}
                  {!currentDownloadUrl && currentFiles?.length ? (
                    <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(226, 232, 255, 0.8)', fontSize: 13 }}>
                      {currentFiles.map((file) => (
                        <li key={`${file?.name ?? file?.url ?? 'file'}-${file?.url ?? 'unknown'}`} style={{ marginBottom: 6 }}>
                          {file?.url ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#38bdf8', fontWeight: 600 }}
                            >
                              {file?.name ?? file.url}
                            </a>
                          ) : (
                            <span>{file?.name ?? 'Download available soon'}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {lastUpdated ? (
                    <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.62)', fontSize: 13 }}>
                      Last update: {lastUpdated}
                    </p>
                  ) : null}
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {shouldShowConfirm && activeTaskId ? (
                    <button
                      type="button"
                      onClick={handleConfirm}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 16,
                        border: '1px solid rgba(148, 163, 184, 0.35)',
                        background: 'rgba(56, 189, 248, 0.18)',
                        color: '#f8fafc',
                        fontWeight: 600,
                      }}
                    >
                      Confirm download
                    </button>
                  ) : null}
                  {pollingEnabled ? (
                    <button
                      type="button"
                      onClick={() => setPollingEnabled(false)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 16,
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        background: 'rgba(15, 23, 42, 0.4)',
                        color: '#e2e8f0',
                      }}
                    >
                      Pause polling
                    </button>
                  ) : null}
                  {activeTaskId ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeTaskId) return
                        if (!pollingEnabled) {
                          setPollingEnabled(true)
                        }
                        orderStatusQuery.refetch()
                      }}
                      disabled={isStatusFetching}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 16,
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        background: 'rgba(56, 189, 248, 0.22)',
                        color: '#0ea5e9',
                        fontWeight: 600,
                      }}
                    >
                      {isStatusFetching ? 'Refreshing…' : pollingEnabled ? 'Poll now' : 'Refresh status'}
                    </button>
                  ) : null}
                </div>

                {isStatusLoading ? (
                  <Toast title="Refreshing status" message="Polling the task for updates." variant="info" />
                ) : null}
                {!pollingEnabled && activeTaskId ? (
                  <Toast
                    title="Polling paused"
                    message="Polling resumes automatically when you refresh."
                    variant="info"
                  />
                ) : null}
                {statusError ? (
                  <Toast title="Status update failed" message={statusError} variant="error" />
                ) : null}
              </div>
            ) : (
              <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.7)' }}>
                Queue an order to start tracking its progress here.
              </p>
            )}
          </section>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 32,
            gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
          }}
        >
          <section style={{ ...panelBaseStyle, padding: '32px clamp(22px, 3vw, 44px)', display: 'grid', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(24px, 2.5vw, 30px)', fontWeight: 700 }}>Bulk queue</h2>
              <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.7)' }}>
                Paste multiple URLs and we will auto-detect supported providers whenever possible.
              </p>
            </div>

            <form onSubmit={handleBulkSubmit} style={{ display: 'grid', gap: 20 }}>
              <Field label="Asset URLs" hint="Enter one URL per line." htmlFor="stock-bulk-urls">
                <textarea
                  id="stock-bulk-urls"
                  value={bulkInput}
                  onChange={(event) => setBulkInput(event.target.value)}
                  rows={6}
                  placeholder={'https://example.com/asset-1\nhttps://example.com/asset-2'}
                  style={{ ...inputSurfaceStyle, minHeight: 168, resize: 'vertical' }}
                />
              </Field>

              <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <Field label="Response type" htmlFor="stock-bulk-response-type">
                  <select
                    id="stock-bulk-response-type"
                    value={bulkResponseType}
                    onChange={(event) =>
                      setBulkResponseType(event.target.value as FormValues['responsetype'])
                    }
                    style={inputSurfaceStyle}
                  >
                    <option value="any">Any (auto)</option>
                    <option value="gdrive">Google Drive</option>
                    <option value="asia">Asia CDN</option>
                    <option value="mydrivelink">My Drive Link</option>
                  </select>
                </Field>

                <Field
                  label="Notification channel"
                  hint="Optional email or webhook for all queued tasks."
                  htmlFor="stock-bulk-notification"
                >
                  <input
                    id="stock-bulk-notification"
                    value={bulkNotificationChannel}
                    onChange={(event) => setBulkNotificationChannel(event.target.value)}
                    placeholder="https://hooks.slack.com/... or email@example.com"
                    style={inputSurfaceStyle}
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={bulkSubmitting}
                style={{
                  ...primaryButtonStyle,
                  cursor: bulkSubmitting ? 'not-allowed' : 'pointer',
                  opacity: bulkSubmitting ? 0.7 : 1,
                }}
              >
                {bulkSubmitting ? 'Queueing…' : 'Queue all URLs'}
              </button>
            </form>

            <div style={{ display: 'grid', gap: 12 }}>
              {bulkResults.map((result) => (
                <div
                  key={`${result.url}-${result.status}-${result.message}`}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 18,
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    background: result.status === 'success' ? 'rgba(22, 163, 74, 0.16)' : 'rgba(239, 68, 68, 0.18)',
                    color: result.status === 'success' ? '#bbf7d0' : '#fecaca',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{result.url}</div>
                  <div style={{ fontSize: 14 }}>{result.message}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...panelBaseStyle, padding: '32px clamp(22px, 3vw, 44px)', display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(24px, 2.5vw, 30px)', fontWeight: 700 }}>Provider insights</h2>
              <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.7)' }}>
                Stay informed about availability and points cost across the network.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {sites.map((provider) => {
                const price = provider.price ?? provider.minPrice ?? null
                const priceDisplay = price != null ? `${price}${provider.currency ? ` ${provider.currency}` : ''}` : '—'
                return (
                  <div
                    key={provider.site}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 18,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(15, 23, 42, 0.35)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{provider.displayName ?? provider.site}</span>
                      <span style={{ fontSize: 13, color: 'rgba(226, 232, 255, 0.68)' }}>{provider.site}</span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px 12px',
                          borderRadius: 999,
                          background: provider.active === false ? 'rgba(239, 68, 68, 0.22)' : 'rgba(34, 197, 94, 0.22)',
                          color: provider.active === false ? '#fee2e2' : '#bbf7d0',
                          fontWeight: 600,
                        }}
                      >
                        {provider.active === false ? 'Offline' : 'Online'}
                      </span>
                      <span style={{ fontSize: 14, color: 'rgba(226, 232, 255, 0.8)' }}>Price: {priceDisplay}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}