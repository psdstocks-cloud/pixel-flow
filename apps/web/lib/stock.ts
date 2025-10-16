
// apps/web/lib/stock.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://pixel-flow-production.up.railway.app'

const withBase = (path: string) =>
  path.startsWith('http') ? path : `${API_BASE_URL.replace(/\/$/, '')}${path}`

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    return (await res.json()) as T
  }

  const raw = await res.text()
  let parsed: unknown = raw
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = raw
    }
  }

  const message =
    typeof parsed === 'string'
      ? parsed
      : JSON.stringify(parsed, null, 2) || res.statusText

  throw new Error(message || res.statusText)
}

export type StockSite = {
  site: string
  displayName?: string
  categories?: string[]
  minPrice?: number
  currency?: string
  active?: boolean
  price?: number
}

type RawSiteEntry = {
  displayName?: string
  categories?: string[]
  minPrice?: number
  currency?: string
  active?: boolean
  price?: number
} | string | null | undefined

type RawSitesResponse = Record<string, RawSiteEntry>

export type StockInfoRequest = {
  site?: string
  id?: string
  url?: string
}

export type StockOrderPayload = StockInfoRequest & {
  responsetype?: 'any' | 'gdrive' | 'asia' | 'mydrivelink'
  notificationChannel?: string
}

export type StockOrderResponse = {
  taskId?: string
  status?: string
  message?: string
  queuedAt?: string
  [key: string]: unknown
}

export type StockStatusResponse = {
  status: string
  progress?: number
  downloadUrl?: string
  files?: Array<{
    name?: string
    url?: string
  }>
  [key: string]: unknown
}

export type StockDownloadOptions = {
  responsetype?: 'any' | 'gdrive' | 'asia' | 'mydrivelink'
  redirect?: boolean
  follow?: boolean
}

export function fetchSites(signal?: AbortSignal) {
  return fetch(withBase('/stock/sites'), {
    headers: { Accept: 'application/json' },
    signal,
  })
    .then<RawSitesResponse>(handleResponse)
    .then((data) =>
      Object.entries(data)
        .filter(([, value]) => typeof value === 'object' && value !== null)
        .map<StockSite>(([site, value]) => {
          const entry = value as Exclude<RawSiteEntry, string | null | undefined>
          return {
            site,
            displayName: entry.displayName,
            categories: entry.categories,
            minPrice: entry.minPrice,
            currency: entry.currency,
            active: entry.active,
            price: entry.price,
          }
        })
        .sort((a, b) => a.site.localeCompare(b.site)),
    )
}

export function fetchInfo(params: StockInfoRequest, signal?: AbortSignal) {
  const url = new URL(withBase('/stock/info'))
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })
  return fetch(url, { headers: { Accept: 'application/json' }, signal }).then(handleResponse)
}

export function createOrder(body: StockOrderPayload, signal?: AbortSignal) {
  return fetch(withBase('/stock/order'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  }).then<StockOrderResponse>(handleResponse)
}

export function getOrderStatus(taskId: string, params: StockDownloadOptions = {}, signal?: AbortSignal) {
  const url = new URL(withBase(`/stock/order/${encodeURIComponent(taskId)}/status`))
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value))
  })
  return fetch(url, { headers: { Accept: 'application/json' }, signal }).then<StockStatusResponse>(handleResponse)
}

export async function downloadOrder(taskId: string, options: StockDownloadOptions = {}) {
  const url = new URL(withBase(`/stock/order/${encodeURIComponent(taskId)}/download`))
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value))
  })
  return fetch(url, { headers: { Accept: 'application/json' } })
}

export const queries = {
  sites: ['stock', 'sites'] as const,
  info: (key: StockInfoRequest) => ['stock', 'info', key] as const,
  orderStatus: (taskId: string) => ['stock', 'order', taskId, 'status'] as const,
}