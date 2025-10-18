'use client'

import type { CSSProperties, FormEvent } from 'react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Field, StatusBadge, Toast } from '../../../components'
import {
  commitOrder,
  confirmOrder,
  detectSiteAndIdFromUrl,
  fetchBalance,
  fetchSites,
  fetchTasks,
  getOrderStatus,
  previewOrder,
  queries,
  type OrderCommitResponse,
  type PreviewRequestItem,
  type PreviewResponse,
  type StockBalance,
  type StockOrderPayload,
  type StockSite,
  type StockStatusResponse,
  type StockTask,
} from '../../../lib/stock'

const MAX_LINKS = 5
const USER_ID = 'demo-user'

type LinkInput = {
  id: string
  url: string
  error?: string
}

type PreviewEntry = {
  id: string
  task?: StockTask
  error?: string
  selected: boolean
}

const createLink = (url = ''): LinkInput => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  url,
})

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function formatPoints(points?: number) {
  if (typeof points !== 'number' || Number.isNaN(points)) return '—'
  return `${points.toLocaleString()} pts`
}

function summarizeProvider(url: string, sites: StockSite[]) {
  const detection = detectSiteAndIdFromUrl(url, sites)
  if (!detection?.site) return null
  const provider = sites.find((site) => site.site === detection.site)
  return provider?.displayName ?? provider?.site ?? detection.site
}

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
  cursor: 'pointer',
  boxShadow: '0 24px 45px rgba(99, 102, 241, 0.28)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
}

export default function StockOrderPage() {
  const [links, setLinks] = useState<LinkInput[]>(() => [createLink()])
  const [responsetype, setResponsetype] = useState<NonNullable<StockOrderPayload['responsetype']>>('any')
  const [previewEntries, setPreviewEntries] = useState<PreviewEntry[]>([])
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [commitError, setCommitError] = useState<string | null>(null)
  const [commitResult, setCommitResult] = useState<OrderCommitResponse | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [statusSnapshot, setStatusSnapshot] = useState<StockStatusResponse | null>(null)
  const [pollingEnabled, setPollingEnabled] = useState(false)

  const queryClient = useQueryClient()

  const sitesQuery = useQuery({
    queryKey: queries.sites,
    queryFn: ({ signal }) => fetchSites(signal),
    staleTime: 5 * 60 * 1000,
  })

  const balanceQuery = useQuery({
    queryKey: queries.balance(USER_ID),
    queryFn: ({ signal }) => fetchBalance(USER_ID, signal),
    staleTime: 60 * 1000,
  })

  const taskQuery = useQuery({
    queryKey: queries.tasks(USER_ID),
    queryFn: ({ signal }) => fetchTasks({ userId: USER_ID, limit: 40 }, signal),
  })

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

  useEffect(() => {
    if (!orderStatusQuery.data) return
    setStatusSnapshot(orderStatusQuery.data)
    const normalized = typeof orderStatusQuery.data.status === 'string' ? orderStatusQuery.data.status.toLowerCase() : ''
    const terminalStatuses = new Set(['completed', 'failed', 'cancelled', 'canceled', 'error'])
    if (terminalStatuses.has(normalized)) {
      setPollingEnabled(false)
    }
  }, [orderStatusQuery.data])

  const sites = useMemo<StockSite[]>(() => sitesQuery.data ?? [], [sitesQuery.data])
  const sitesLoading = sitesQuery.isLoading
  const sitesError =
    sitesQuery.isError && sitesQuery.error instanceof Error
      ? sitesQuery.error.message
      : sitesQuery.isError
        ? 'Unable to load stock sites.'
        : null

  const addLink = () => {
    setLinks((prev) => (prev.length >= MAX_LINKS ? prev : [...prev, createLink()]))
  }

  const removeLink = (id: string) => {
    setLinks((prev) => {
      if (prev.length <= 1) return [createLink()]
      return prev.filter((link) => link.id !== id)
    })
  }

  const updateLink = (id: string, url: string) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, url, error: undefined } : link)))
  }

  const previewMutation = useMutation({
    mutationFn: previewOrder,
    onMutate: () => {
      setPreviewError(null)
      setCommitError(null)
      setCommitResult(null)
    },
    onSuccess: (data: PreviewResponse) => {
      const nextEntries = data.results.map((result, index) => ({
        id: result.task?.taskId ?? `${Date.now()}-${index}`,
        task: result.task,
        error: result.error,
        selected: Boolean(result.task && !result.error),
      }))
      setPreviewEntries(nextEntries)
      if (data.balance) {
        queryClient.setQueryData(queries.balance(USER_ID), data.balance)
      }
    },
    onError: (error: unknown) => {
      setPreviewEntries([])
      setPreviewError(error instanceof Error ? error.message : 'Failed to preview links.')
    },
  })

  const commitMutation = useMutation({
    mutationFn: commitOrder,
    onMutate: () => {
      setCommitError(null)
    },
    onSuccess: (data: OrderCommitResponse) => {
      setCommitResult(data)
      setPreviewEntries((prev) =>
        prev.map((entry) => {
          const updated = data.tasks.find((task) => task.taskId === entry.task?.taskId)
          if (!updated) return entry
          return { ...entry, task: updated, selected: false }
        }),
      )
      if (data.balance) {
        queryClient.setQueryData(queries.balance(USER_ID), data.balance)
      }
      queryClient.invalidateQueries(queries.tasks(USER_ID))
      if (data.failures.length > 0) {
        const failureSummary = data.failures
          .map((failure) => `${failure.taskId.slice(0, 8)}…: ${failure.error}`)
          .join('\n')
        setCommitError(`Some tasks failed to queue:\n${failureSummary}`)
      }
      const nextTaskId = data.tasks.find((task) => task.status !== 'error')?.taskId ?? data.tasks[0]?.taskId
      if (nextTaskId) {
        setActiveTaskId(nextTaskId)
        setStatusSnapshot(null)
        setPollingEnabled(true)
      }
    },
    onError: (error: unknown) => {
      setCommitError(error instanceof Error ? error.message : 'Failed to queue selected tasks.')
    },
  })

  const handlePreviewSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextLinks = links.map((link) => {
      const trimmed = link.url.trim()
      let error: string | undefined
      if (!trimmed) {
        error = 'Enter a direct URL to preview.'
      } else if (!isValidHttpUrl(trimmed)) {
        error = 'Use a valid URL starting with http:// or https://.'
      }
      return { ...link, url: trimmed, error }
    })
    setLinks(nextLinks)
    if (nextLinks.some((link) => link.error)) return

    const items: PreviewRequestItem[] = nextLinks.map((link) => ({ url: link.url }))
    previewMutation.mutate({ userId: USER_ID, items, responsetype })
  }

  const toggleSelection = (taskId: string, selected: boolean) => {
    setPreviewEntries((prev) =>
      prev.map((entry) => (entry.task?.taskId === taskId ? { ...entry, selected } : entry)),
    )
  }

  const selectedTaskIds = previewEntries
    .filter((entry) => entry.selected && entry.task?.taskId)
    .map((entry) => entry.task!.taskId)

  const totalPreviewPoints = previewEntries.reduce((sum, entry) => sum + (entry.task?.costPoints ?? 0), 0)
  const selectedPoints = previewEntries.reduce(
    (sum, entry) => sum + (entry.selected && entry.task?.costPoints ? entry.task.costPoints : 0),
    0,
  )

  const availablePoints = balanceQuery.data?.points ?? 0
  const insufficientBalance = selectedPoints > availablePoints

  const handleCommitSelected = () => {
    if (selectedTaskIds.length === 0 || insufficientBalance) return
    commitMutation.mutate({ userId: USER_ID, taskIds: selectedTaskIds, responsetype })
  }

  const handleCommitSingle = (taskId: string) => {
    if (!taskId) return
    commitMutation.mutate({ userId: USER_ID, taskIds: [taskId], responsetype })
  }

  const handleConfirm = async () => {
    if (!activeTaskId) return
    try {
      const response = await confirmOrder(activeTaskId, { responsetype })
      setStatusSnapshot(response)
      setPollingEnabled(true)
      orderStatusQuery.refetch()
    } catch (error) {
      setCommitError(error instanceof Error ? error.message : 'Failed to confirm order.')
    }
  }

  const currentStatus = statusSnapshot?.status ?? 'queued'
  const currentMessage =
    (typeof statusSnapshot?.message === 'string' && statusSnapshot.message) ||
    (typeof statusSnapshot?.latestMessage === 'string' && statusSnapshot.latestMessage) ||
    undefined
  const currentProgress = statusSnapshot?.progress
  const currentDownloadUrl = statusSnapshot?.downloadUrl as string | undefined
  const currentFiles = Array.isArray(statusSnapshot?.files)
    ? (statusSnapshot?.files as StockStatusResponse['files'])
    : undefined
  const lastUpdated = statusSnapshot
    ? new Date(orderStatusQuery.dataUpdatedAt || Date.now()).toLocaleString()
    : null

  const normalizedStatus = currentStatus?.toLowerCase?.() ?? ''
  const hasDownloadArtifacts = Boolean(currentDownloadUrl || (currentFiles && currentFiles.length > 0))
  const shouldShowConfirm = normalizedStatus === 'ready' && hasDownloadArtifacts

  const headlineStats = [
    {
      label: 'Active providers',
      value: (sites.filter((site) => site.active !== false).length || sites.length || '—') as string | number,
    },
    {
      label: 'Previewed links',
      value: previewEntries.filter((entry) => entry.task).length,
    },
    {
      label: 'Live task state',
      value: normalizedStatus ? normalizedStatus.toUpperCase() : '—',
    },
  ]

  const supportedSiteNames = sites.slice(0, 14).map((site) => site.displayName ?? site.site)

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
                Download up to five stock assets in a single, fluid workflow.
              </h1>
              <p style={{ color: 'rgba(226, 232, 255, 0.78)', margin: '12px 0 0', fontSize: 'clamp(16px, 2vw, 18px)' }}>
                Preview costs, reserve assets in batches, and track delivery without leaving this glass desk. Your balance updates instantly when orders are committed.
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
                <h2 style={{ margin: 0, fontSize: 'clamp(26px, 3vw, 32px)', fontWeight: 700 }}>Preview up to five links</h2>
                <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.75)' }}>
                  Paste direct asset URLs. We detect providers, estimate cost, and hold previews so you can queue everything together or one-by-one.
                </p>
              </div>

              <form onSubmit={handlePreviewSubmit} style={{ display: 'grid', gap: 24 }}>
                <div style={{ display: 'grid', gap: 16 }}>
                  {links.map((link, index) => {
                    const provider = summarizeProvider(link.url, sites)
                    return (
                      <Fragment key={link.id}>
                        <Field
                          label={`Link ${index + 1}`}
                          hint={provider ? `Detected provider: ${provider}` : 'Paste a direct stock asset URL.'}
                          error={link.error}
                          htmlFor={`link-${link.id}`}
                        >
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <input
                              id={`link-${link.id}`}
                              value={link.url}
                              onChange={(event) => updateLink(link.id, event.target.value)}
                              placeholder="https://example.com/asset"
                              style={{ ...inputSurfaceStyle, flex: 1 }}
                            />
                            {links.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeLink(link.id)}
                                style={{
                                  padding: '10px 16px',
                                  borderRadius: 16,
                                  border: '1px solid rgba(148, 163, 184, 0.35)',
                                  background: 'rgba(15, 23, 42, 0.4)',
                                  color: '#e2e8f0',
                                  fontWeight: 600,
                                }}
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                        </Field>
                      </Fragment>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={addLink}
                    disabled={links.length >= MAX_LINKS}
                    style={{
                      padding: '12px 18px',
                      borderRadius: 18,
                      border: '1px solid rgba(148, 163, 184, 0.35)',
                      background: links.length >= MAX_LINKS ? 'rgba(100, 116, 139, 0.24)' : 'rgba(56, 189, 248, 0.18)',
                      color: '#f8fafc',
                      fontWeight: 600,
                      cursor: links.length >= MAX_LINKS ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {links.length >= MAX_LINKS ? 'Link limit reached' : 'Add another link'}
                  </button>

                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label htmlFor="responsetype" style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'rgba(226, 232, 255, 0.8)' }}>
                      Preferred delivery
                    </label>
                    <select
                      id="responsetype"
                      value={responsetype}
                      onChange={(event) =>
                        setResponsetype(event.target.value as NonNullable<StockOrderPayload['responsetype']>)
                      }
                      style={inputSurfaceStyle}
                    >
                      <option value="any">Any (auto)</option>
                      <option value="gdrive">Google Drive</option>
                      <option value="asia">Asia CDN</option>
                      <option value="mydrivelink">My Drive Link</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={previewMutation.isPending}
                  style={{
                    ...primaryButtonStyle,
                    cursor: previewMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: previewMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {previewMutation.isPending ? 'Generating preview…' : 'Preview links'}
                </button>

                {balanceQuery.isLoading ? (
                  <Toast title="Loading balance…" message="Fetching your current points." variant="info" />
                ) : null}
                {balanceQuery.isError ? (
                  <Toast
                    title="Could not load balance"
                    message={balanceQuery.error instanceof Error ? balanceQuery.error.message : 'Try again later.'}
                    variant="error"
                  />
                ) : null}
                {sitesLoading ? (
                  <Toast title="Loading providers…" message="Fetching providers from the API." variant="info" />
                ) : null}
                {sitesError ? (
                  <Toast title="Could not load providers" message={sitesError} variant="error" />
                ) : null}
                {previewError ? <Toast title="Preview failed" message={previewError} variant="error" /> : null}
              </form>

              <div style={{ display: 'grid', gap: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'grid', gap: 4 }}>
                    <span style={{ fontSize: 14, color: 'rgba(226, 232, 255, 0.7)' }}>Available points</span>
                    <strong style={{ fontSize: 24 }}>{formatPoints(balanceQuery.data?.points)}</strong>
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <span style={{ fontSize: 14, color: 'rgba(226, 232, 255, 0.7)' }}>Selected cost</span>
                    <strong style={{ fontSize: 24, color: insufficientBalance ? '#f87171' : '#f8fafc' }}>
                      {formatPoints(selectedPoints)}
                    </strong>
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <span style={{ fontSize: 14, color: 'rgba(226, 232, 255, 0.7)' }}>Preview total</span>
                    <strong style={{ fontSize: 20 }}>{formatPoints(totalPreviewPoints)}</strong>
                  </div>
                </div>

                {previewEntries.length > 0 ? (
                  <div style={{ display: 'grid', gap: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Preview results</h3>
                    {previewEntries.map((entry) => {
                      const task = entry.task
                      return (
                        <div
                          key={entry.id}
                          style={{
                            display: 'grid',
                            gap: 12,
                            padding: '18px 20px',
                            borderRadius: 24,
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            background: 'rgba(15, 23, 42, 0.4)',
                          }}
                        >
                          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <input
                              type="checkbox"
                              checked={entry.selected && Boolean(task)}
                              onChange={(event) => toggleSelection(task?.taskId ?? '', event.target.checked)}
                              disabled={!task}
                              style={{ width: 18, height: 18 }}
                            />
                            <div style={{ flex: 1, display: 'grid', gap: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ display: 'grid', gap: 4 }}>
                                  <strong style={{ fontSize: 18 }}>
                                    {task?.title ?? 'Preview unavailable'}
                                  </strong>
                                  <span style={{ fontSize: 14, color: 'rgba(226, 232, 255, 0.7)' }}>
                                    {task?.site ? `${task.site}${task.assetId ? ` • ${task.assetId}` : ''}` : 'Unknown provider'}
                                  </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: 14, color: 'rgba(226, 232, 255, 0.7)' }}>Cost</span>
                                  <div style={{ fontSize: 18, fontWeight: 600 }}>{formatPoints(task?.costPoints)}</div>
                                </div>
                              </div>
                              <div style={{ fontSize: 14, color: 'rgba(226, 232, 255, 0.72)' }}>
                                {entry.error ?? task?.latestMessage ?? 'Ready to order.'}
                              </div>
                              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => handleCommitSingle(task?.taskId ?? '')}
                                  disabled={!task || commitMutation.isPending || insufficientBalance}
                                  style={{
                                    padding: '10px 16px',
                                    borderRadius: 16,
                                    border: '1px solid rgba(148, 163, 184, 0.35)',
                                    background: task && !insufficientBalance ? 'rgba(56, 189, 248, 0.22)' : 'rgba(100, 116, 139, 0.24)',
                                    color: '#0ea5e9',
                                    fontWeight: 600,
                                    cursor: task && !insufficientBalance ? 'pointer' : 'not-allowed',
                                  }}
                                >
                                  Order individually
                                </button>
                                {task?.previewUrl ? (
                                  <a
                                    href={task.previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: '10px 16px',
                                      borderRadius: 16,
                                      border: '1px solid rgba(148, 163, 184, 0.35)',
                                      color: '#38bdf8',
                                      fontWeight: 600,
                                    }}
                                  >
                                    View preview
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      onClick={handleCommitSelected}
                      disabled={selectedTaskIds.length === 0 || commitMutation.isPending || insufficientBalance}
                      style={{
                        ...primaryButtonStyle,
                        cursor:
                          selectedTaskIds.length === 0 || commitMutation.isPending || insufficientBalance
                            ? 'not-allowed'
                            : 'pointer',
                        opacity:
                          selectedTaskIds.length === 0 || commitMutation.isPending || insufficientBalance ? 0.65 : 1,
                      }}
                    >
                      {commitMutation.isPending ? 'Queuing order…' : 'Queue selected links'}
                    </button>

                    {insufficientBalance ? (
                      <Toast
                        title="Insufficient balance"
                        message="Reduce selection or top up points to continue."
                        variant="warning"
                      />
                    ) : null}
                  </div>
                ) : null}

                {commitError ? <Toast title="Order issue" message={commitError} variant="error" /> : null}
                {commitResult && commitResult.pointsDeducted > 0 ? (
                  <Toast
                    title="Points deducted"
                    message={`Deducted ${formatPoints(commitResult.pointsDeducted)} from balance.`}
                    variant="success"
                  />
                ) : null}
              </div>

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

            {statusSnapshot || activeTaskId ? (
              <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <StatusBadge status={currentStatus ?? 'queued'} />
                    <div style={{ fontWeight: 600 }}>Task ID: {activeTaskId ?? 'Unknown'}</div>
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
                      {currentFiles.map((file, index) => (
                        <li key={`${file?.url ?? file?.name ?? 'file'}-${index}`} style={{ marginBottom: 6 }}>
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
                    <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.62)', fontSize: 13 }}>Last update: {lastUpdated}</p>
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
                      disabled={orderStatusQuery.isFetching}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 16,
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        background: 'rgba(56, 189, 248, 0.22)',
                        color: '#0ea5e9',
                        fontWeight: 600,
                      }}
                    >
                      {orderStatusQuery.isFetching ? 'Refreshing…' : pollingEnabled ? 'Poll now' : 'Refresh status'}
                    </button>
                  ) : null}
                </div>

                {orderStatusQuery.isLoading ? (
                  <Toast title="Refreshing status" message="Polling the task for updates." variant="info" />
                ) : null}
                {!pollingEnabled && activeTaskId ? (
                  <Toast title="Polling paused" message="Polling resumes when you refresh." variant="info" />
                ) : null}
              </div>
            ) : (
              <Toast title="No active task" message="Preview and queue links to start tracking progress." variant="info" />
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Recent tasks</h3>
              {taskQuery.isLoading ? (
                <Toast title="Loading tasks…" message="Fetching recent orders." variant="info" />
              ) : taskQuery.isError ? (
                <Toast
                  title="Could not load tasks"
                  message={taskQuery.error instanceof Error ? taskQuery.error.message : 'Try again soon.'}
                  variant="error"
                />
              ) : taskQuery.data?.length ? (
                <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10 }}>
                  {taskQuery.data.map((task) => (
                    <li key={task.taskId} style={{ display: 'grid', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{task.title ?? task.taskId}</span>
                        <span style={{ color: 'rgba(226, 232, 255, 0.7)' }}>{formatPoints(task.costPoints)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(226, 232, 255, 0.65)' }}>
                        {task.status?.toUpperCase?.() ?? 'UNKNOWN'} • Updated {new Date(task.updatedAt).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: 'rgba(226, 232, 255, 0.7)' }}>No recent tasks yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
