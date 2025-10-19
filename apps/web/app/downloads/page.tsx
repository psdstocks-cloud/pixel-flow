'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, StatusBadge, Toast } from '../../components'
import { useSession } from '../../lib/session'
import {
  buildDownloadUrl,
  fetchDownloadHistory,
  queries,
  requestRedownload,
  type ResponseType,
  type StockOrderTask,
} from '../../lib/stock'

const DEFAULT_LIMIT = 50

const RESPONSE_TYPES: Array<{ label: string; value: ResponseType }> = [
  { label: 'Any (auto)', value: 'any' },
  { label: 'Google Drive', value: 'gdrive' },
  { label: 'Asia CDN', value: 'asia' },
  { label: 'My Drive Link', value: 'mydrivelink' },
]

const STATUS_FILTERS: Array<{ label: string; value: string | null }> = [
  { label: 'All statuses', value: null },
  { label: 'Ready to download', value: 'ready' },
  { label: 'Completed', value: 'completed' },
  { label: 'Queued or processing', value: 'queued,processing,running' },
  { label: 'Errors only', value: 'error,failed' },
]

function formatDate(value: string) {
  try {
    const parsed = new Date(value)
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
  } catch {
    return value
  }
}

function HistoryCard({ task, onRedownload }: { task: StockOrderTask; onRedownload: (taskId: string) => void }) {
  const latestMessage = task.latestMessage ?? '—'
  const title = task.title ?? task.assetId ?? task.sourceUrl
  const downloadUrl = task.downloadUrl ? buildDownloadUrl(task.taskId, task.responsetype ?? 'any') : null

  return (
    <Card
      title={title}
      description={task.site ? `${task.site} • ${task.assetId ?? 'unknown id'}` : task.sourceUrl}
      footer={
        <div className="status-actions">
          {downloadUrl ? (
            <a className="link-button" href={downloadUrl} rel="noopener noreferrer" target="_blank">
              Download file
            </a>
          ) : null}
          <button type="button" className="secondary" onClick={() => onRedownload(task.taskId)}>
            Refresh link
          </button>
        </div>
      }
    >
      <div className="status-badge-row">
        <StatusBadge status={task.status} />
        <span>{latestMessage}</span>
      </div>
      <div className="status-timeline" style={{ marginTop: 16 }}>
        <div className="status-step">
          <span style={{ fontWeight: 600 }}>Created</span>
          <span>{formatDate(task.createdAt)}</span>
        </div>
        <div className="status-step">
          <span style={{ fontWeight: 600 }}>Updated</span>
          <span>{formatDate(task.updatedAt)}</span>
        </div>
        <div className="status-step">
          <span style={{ fontWeight: 600 }}>Cost</span>
          <span>{task.costPoints != null ? `${task.costPoints} pts` : '—'}</span>
        </div>
      </div>
    </Card>
  )
}

export default function DownloadsPage() {
  const { session, status, error } = useSession()
  const queryClient = useQueryClient()

  const userId = session?.userId ?? null
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [responseType, setResponseType] = useState<ResponseType>('any')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const historyQuery = useQuery({
    queryKey: userId ? queries.downloadsHistory(userId, DEFAULT_LIMIT, statusFilter ?? 'all') : ['downloads', 'anonymous'],
    queryFn: ({ signal }) => {
      if (!userId) throw new Error('Missing user identity')
      return fetchDownloadHistory(userId, DEFAULT_LIMIT, statusFilter ?? undefined, signal)
    },
    enabled: Boolean(userId),
    staleTime: 10_000,
  })

  const redownloadMutation = useMutation({
    mutationFn: (taskId: string) => {
      if (!userId) throw new Error('Missing user identity')
      return requestRedownload(taskId, userId, responseType)
    },
    onSuccess: ({ download }) => {
      if (!userId) return
      void queryClient.invalidateQueries({
        queryKey: queries.downloadsHistory(userId, DEFAULT_LIMIT, statusFilter ?? 'all'),
      })
      if (download.downloadUrl) {
        window.open(download.downloadUrl, '_blank', 'noopener,noreferrer')
        setFeedback({ type: 'success', message: 'Download link refreshed in a new tab.' })
      } else {
        setFeedback({ type: 'error', message: 'No download link is available yet. Try again soon.' })
      }
    },
    onError: (err: unknown) => {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to refresh the download link.',
      })
    },
  })

  const downloadTasks = useMemo(() => historyQuery.data?.downloads ?? [], [historyQuery.data])
  const showSignInWarning = status === 'ready' && !userId

  return (
    <main>
      <section className="order-hero">
        <span className="hero-badge">Downloads</span>
        <h1>Your stock download history</h1>
        <p className="hero-description">
          Track completed orders, refresh download links, and recover previous purchases without re-running upstream jobs.
        </p>
      </section>

      {status === 'loading' ? (
        <Toast title="Loading session" message="Fetching your account details." variant="info" />
      ) : null}
      {error ? <Toast title="Session unavailable" message={error.message} variant="error" /> : null}
      {showSignInWarning ? (
        <Toast
          title="Sign in required"
          message="Log in to view your download history."
          variant="error"
        />
      ) : null}
      {feedback ? <Toast title={feedback.type === 'success' ? 'Success' : 'Action needed'} message={feedback.message} variant={feedback.type} /> : null}

      <div className="glass-grid">
        <Card
          title="Filters"
          description="Narrow your download history by status and preferred delivery type."
          footer={
            redownloadMutation.isPending ? (
              <span style={{ color: 'var(--pf-text-muted)' }}>Refreshing download link…</span>
            ) : null
          }
        >
          <div className="form-grid">
            <label className="field-root">
              <span className="field-label">Status filter</span>
              <select
                value={statusFilter ?? ''}
                onChange={(event) => setStatusFilter(event.target.value || null)}
                disabled={!userId || historyQuery.isLoading}
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.label} value={option.value ?? ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-root">
              <span className="field-label">Download response type</span>
              <select
                value={responseType}
                onChange={(event) => setResponseType(event.target.value as ResponseType)}
                disabled={!userId}
              >
                {RESPONSE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="field-hint">
                Applies when refreshing a download link. Choose the format that works best for your workflow.
              </span>
            </label>
          </div>
        </Card>

        {historyQuery.isLoading ? (
          <Toast title="Loading downloads" message="Gathering your download history." variant="info" />
        ) : null}
        {historyQuery.isError ? (
          <Toast
            title="Unable to load history"
            message={historyQuery.error instanceof Error ? historyQuery.error.message : 'Unexpected error.'}
            variant="error"
          />
        ) : null}

        {downloadTasks.length === 0 && historyQuery.isSuccess ? (
          <Card title="No downloads yet" description="Once you complete stock orders, they will appear here for quick access.">
            <p>
              Head over to the stock ordering flow to queue your first download. Completed items will surface automatically
              in this list.
            </p>
          </Card>
        ) : null}

        {downloadTasks.map((task) => (
          <HistoryCard key={task.taskId} task={task} onRedownload={(taskId) => redownloadMutation.mutate(taskId)} />
        ))}
      </div>
    </main>
  )
}
