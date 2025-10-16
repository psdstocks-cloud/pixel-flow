'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
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
  queries,
  type StockOrderPayload,
  type StockOrderResponse,
  type StockSite,
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

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  const hasUrl = values.url.trim().length > 0
  const hasSite = values.site.trim().length > 0
  const hasId = values.id.trim().length > 0

  if (!hasUrl && !(hasSite && hasId)) {
    const message = 'Provide a direct URL or supply both site and asset ID.'
    errors.url = message
    errors.site = message
    errors.id = message
  } else {
    if (hasSite && !hasId) errors.id = 'An asset ID is required when a site is selected.'
    if (hasId && !hasSite) errors.site = 'Select a site when providing an asset ID.'
  }

  return errors
}

export default function StockOrderPage() {
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [latestResult, setLatestResult] = useState<LatestResult>(null)

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

  const createOrderMutation = useMutation({
    mutationFn: async (payload: StockOrderPayload) => createOrder(payload),
    onMutate: () => {
      setLatestResult(null)
    },
    onSuccess: (data) => {
      setLatestResult({ status: 'success', response: data })
      setFormErrors({})
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to queue the stock order.'
      setLatestResult({ status: 'error', message })
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(formValues)
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload: StockOrderPayload = {
      site: formValues.site || undefined,
      id: formValues.id || undefined,
      url: formValues.url || undefined,
      responsetype: formValues.responsetype,
      notificationChannel: formValues.notificationChannel || undefined,
    }

    createOrderMutation.mutate(payload)
  }

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
          {latestResult?.status === 'success' ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <StatusBadge status={latestResult.response.status ?? 'queued'} />
              <div>
                <strong>Task ID:</strong>{' '}
                {latestResult.response.taskId ?? 'Awaiting identifier'}
              </div>
              {latestResult.response.message ? (
                <p style={{ margin: 0 }}>{latestResult.response.message}</p>
              ) : null}
              <Toast
                title="Order queued"
                message="Status polling will be added in the next step."
                variant="success"
              />
            </div>
          ) : latestResult?.status === 'error' ? (
            <Toast title="Could not queue order" message={latestResult.message} variant="error" />
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