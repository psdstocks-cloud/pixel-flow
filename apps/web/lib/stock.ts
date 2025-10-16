// apps/web/lib/stock.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'

const withBase = (path: string) =>
  path.startsWith('http') ? path : `${API_BASE_URL.replace(/\/$/, '')}${path}`

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: unknown
    try {
      detail = await res.json()
    } catch {
      detail = await res.text()
    }
    throw new Error(
      typeof detail === 'string'
        ? detail
        : JSON.stringify(detail, null, 2) ?? res.statusText,
    )
  }
  return (await res.json()) as T
}

export type StockSite = {
  site: string
  displayName?: string
  categories?: string[]
  minPrice?: number
  currency?: string
}

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
  }).then<StockSite[]>(handleResponse)
}

export function fetchInfo(params: StockInfoRequest, signal?: AbortSignal) {
  const url = new URL(withBase('/stock/info'))
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })
  return fetch(url, { headers: { Accept: 'application/json' }, signal }).then(handleResponse)
}

export function createOrder(body: StockOrderPayload, signal?: AbortSignal) {
  const url = new URL(withBase('/stock/order'))
  const query = new URLSearchParams()
  Object.entries(body).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  url.search = query.toString()
  return fetch(url, { headers: { Accept: 'application/json' }, signal }).then<StockOrderResponse>(handleResponse)
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