'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Card,
  Field,
  SectionHeader,
  StatusBadge,
  Toast,
} from '../../../components'
import {
  createOrder,
  fetchSites,
  getOrderStatus,
  queries,
  type StockOrderPayload,
  type StockOrderResponse,
  type StockSite,
  type StockStatusResponse,
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

export default function StockOrderPage() {
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [latestResult, setLatestResult] = useState<LatestResult>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [pollingEnabled, setPollingEnabled] = useState(false)
  const [statusSnapshot, setStatusSnapshot] = useState<StockStatusResponse | null>(null)

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
  const queuedAt = latestSuccess?.queuedAt ? new Date(latestSuccess.queuedAt).toLocaleString() : null
  const lastUpdated = statusSnapshot
    ? new Date(orderStatusQuery.dataUpdatedAt || Date.now()).toLocaleString()
    : queuedAt

  const showStatusPanel = Boolean(activeTaskId || statusSnapshot || latestSuccess)

  return (
    <main style={{ padding: '48px 56px', display: 'grid', gap: 32 }}>
      <SectionHeader
        title="Stock Order"
        subtitle="Queue and track stock asset downloads across your connected providers."
      />

      <div className="grid two-column" style={{ alignItems: 'start', gap: 24 }}>
        <Card
          title="Order details"
          description="Provide a URL or a site + ID to begin processing your download task."
        >
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
            <Field
              label="Site"
              hint="Required if you don’t provide a direct URL."
              error={formErrors.site}
            >
              <select
                value={formValues.site}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, site: event.target.value }))
                }
                disabled={sitesLoading}
                style={{ width: '100%', padding: '10px 12px' }}
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
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, id: event.target.value }))
                }
                placeholder="e.g. 123456789"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </Field>

            <Field
              label="Direct URL"
              hint="Alternative to site + ID. Paste the full asset URL."
              error={formErrors.url}
            >
              <input
                value={formValues.url}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, url: event.target.value }))
                }
                placeholder="https://example.com/asset"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </Field>

            <Field label="Response type">
              <select
                value={formValues.responsetype}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    responsetype: event.target.value as FormValues['responsetype'],
                  }))
                }
                style={{ width: '100%', padding: '10px 12px' }}
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
            >
              <input
                value={formValues.notificationChannel}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    notificationChannel: event.target.value,
                  }))
                }
                placeholder="https://hooks.slack.com/... or email@example.com"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </Field>

            <button
              className="primary"
              type="submit"
              disabled={createOrderMutation.isPending}
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                background: '#0ea5e9',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                cursor: createOrderMutation.isPending ? 'not-allowed' : 'pointer',
                
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
        </Card>

        <Card
          title="Task status"
          description="Monitor progress, download results, and review recent activity."
        >
          {latestError ? (
            <Toast title="Could not queue order" message={latestError.message} variant="error" />
          ) : showStatusPanel ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatusBadge status={currentStatus ?? 'queued'} />
                  <div>
                    <strong>Task ID:</strong> {activeTaskId ?? latestSuccess?.taskId ?? 'Unknown'}
                  </div>
                </div>
                {currentMessage ? <p style={{ margin: 0 }}>{currentMessage as string}</p> : null}
                {typeof currentProgress === 'number' ? (
                  <p style={{ margin: 0 }}>Progress: {Math.round(currentProgress)}%</p>
                ) : null}
                {currentDownloadUrl ? (
                  <a
                    href={currentDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0ea5e9', fontWeight: 600 }}
                  >
                    Download latest files
                  </a>
                ) : null}
                {lastUpdated ? (
                  <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                    Last update: {lastUpdated}
                  </p>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {pollingEnabled ? (
                  <button
                    type="button"
                    onClick={() => setPollingEnabled(false)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}
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
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #0ea5e9',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      fontWeight: 600,
                    }}
                  >
                    {isStatusFetching ? 'Refreshing…' : pollingEnabled ? 'Poll now' : 'Refresh status'}
                  </button>
                ) : null}
              </div>
              {isStatusLoading ? (
                <Toast
                  title="Refreshing status"
                  message="Polling the task for updates."
                  variant="info"
                />
              ) : null}
              {!pollingEnabled && activeTaskId ? (
                <Toast
                  title="Polling paused"
                  message="Automatic updates are paused after reaching a final state. Use refresh to check again."
                  variant="info"
                />
              ) : null}
              {statusError ? (
                <Toast title="Status unavailable" message={statusError} variant="error" />
              ) : null}
            </div>
          ) : latestSuccess ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <StatusBadge status={latestSuccess.status ?? 'queued'} />
              <div>
                <strong>Task ID:</strong>{' '}
                {latestSuccess.taskId ?? 'Awaiting identifier'}
              </div>
              {latestSuccess.message ? (
                <p style={{ margin: 0 }}>{latestSuccess.message}</p>
              ) : null}
              {queuedAt ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Queued at: {queuedAt}</p>
              ) : null}
              <Toast title="Order queued" message="Waiting for the first status update." variant="success" />
            </div>
          ) : (
            <p style={{ color: '#94a3b8', margin: 0 }}>
              Submit an order to see its status here.
            </p>
          )}
        </Card>
      </div>
    </main>
  )
}