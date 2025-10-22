import { z } from 'zod'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestInitExtras = {
  path: string
  method?: RequestMethod
  searchParams?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
}

type JsonRecord = Record<string, unknown>

type StockInfoRequest = {
  url?: string
  site?: string
  id?: string
  responsetype?: string
}

type CreateOrderRequest = {
  site?: string
  id?: string
  url?: string
  responsetype?: string
  notification_channel?: string
}

type OrderStatusResponse = {
  success: boolean
  status?: string
  message?: string
  progress?: number | null
  download_url?: string
  details?: JsonRecord
}

type ConfirmOrderResponse = {
  success: boolean
  message?: string
  download_url?: string
}

type DownloadOrderResponse = {
  success: boolean
  downloadUrl?: string
  fileName?: string
  raw: JsonRecord
}

type StockInfo = {
  site?: string
  assetId?: string
  title?: string
  previewUrl?: string
  thumbnailUrl?: string
  costPoints?: number | null
  costAmount?: number | null
  costCurrency?: string | null
  sourceUrl?: string | null
  raw: JsonRecord
}

type StockSite = {
  site: string
  displayName?: string
  price?: number
  minPrice?: number
  currency?: string
  active?: boolean
  raw: JsonRecord
}

const NEHTW_BASE_URL = process.env.NEHTW_BASE_URL || 'https://nehtw.com/api'
const NEHTW_API_KEY = process.env.NEHTW_API_KEY

if (!NEHTW_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[nehtw] NEHTW_API_KEY is not set. Requests will fail until configured.')
}

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'pixel-flow/1.0 (+https://github.com/psdstocks-cloud/pixel-flow)',
  Accept: 'application/json, */*;q=0.8',
}

const StockInfoSchema = z.object({}).catchall(z.any())
const SitesSchema = z.record(z.string(), z.unknown())
const OrderResponseSchema = z
  .object({
    success: z.boolean().optional(),
    job_id: z.string().optional(),
    task_id: z.string().optional(),
    status: z.string().optional(),
    message: z.string().optional(),
    queued_at: z.string().optional(),
    actions: z.unknown().optional(),
    downloadLink: z.string().optional(),
    downloadUrl: z.string().optional(),
    url: z.string().optional(),
    link: z.string().optional(),
  })
  .catchall(z.unknown())
const OrderStatusSchema = z
  .object({
    success: z.boolean().optional(),
    status: z.string().optional(),
    message: z.union([z.string(), z.object({})]).optional(),
    progress: z.number().nullable().optional(),
    download_url: z.string().optional(),
  })
  .catchall(z.unknown())

const DownloadSchema = z
  .object({
    downloadLink: z.string().optional(),
    downloadUrl: z.string().optional(),
    url: z.string().optional(),
    link: z.string().optional(),
    fileName: z.string().optional(),
  })
  .catchall(z.unknown())

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path.startsWith('http') ? path : `${NEHTW_BASE_URL}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function requestJSON<T extends JsonRecord>(options: RequestInitExtras): Promise<T> {
  const { path, method = 'GET', searchParams, headers, body, signal } = options
  const url = buildUrl(path, searchParams)
  const init: RequestInit = {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
      'X-Api-Key': NEHTW_API_KEY || '',
    },
    signal,
  }

  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body)
    init.headers = {
      'Content-Type': 'application/json',
      ...init.headers,
    }
  }

  const response = await fetch(url, init)
  const text = await response.text()

  if (!response.ok) {
    throw new Error(text || `NEHTW request failed (status ${response.status})`)
  }

  try {
    return (text ? (JSON.parse(text) as JsonRecord) : {}) as T
  } catch (error) {
    throw new Error(`Failed to parse NEHTW response as JSON: ${(error as Error).message}`)
  }
}

function safeString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  return undefined
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '')
    if (cleaned.length === 0) return null
    const parsed = Number(cleaned)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function determineCostPoints(info: JsonRecord): number | null {
  const candidates = [info.points, info.cost, info.price]
  for (const candidate of candidates) {
    const numeric = toNumber(candidate)
    if (numeric !== null) return Math.max(Math.ceil(numeric), 0)
  }
  return null
}

function determineCostAmount(info: JsonRecord): number | null {
  const candidates = [info.cost, info.price]
  for (const candidate of candidates) {
    const numeric = toNumber(candidate)
    if (numeric !== null) return numeric
  }
  return null
}

function determineCurrency(info: JsonRecord): string | null {
  return safeString(info.currency) || safeString(info.currencyCode) || null
}

function pickPreviewUrl(info: JsonRecord): string | undefined {
  return (
    safeString(info.preview) ||
    safeString(info.previewUrl) ||
    safeString(info.preview_url) ||
    safeString(info.image) ||
    safeString(info.thumb) ||
    safeString(info.thumbnail)
  )
}

function pickThumbnail(info: JsonRecord): string | undefined {
  return safeString(info.thumbnail) || safeString(info.thumb) || safeString(info.previewThumb) || pickPreviewUrl(info)
}

function pickTitle(info: JsonRecord): string | undefined {
  return (
    safeString(info.title) ||
    safeString(info.name) ||
    safeString(info.filename) ||
    safeString(info.fileName) ||
    safeString(info.message)
  )
}

function pickAssetId(info: JsonRecord): string | undefined {
  const direct =
    safeString(info.assetId) ||
    safeString(info.stockId) ||
    safeString(info.asset) ||
    safeString(info.fileId) ||
    safeString(info.id)
  if (direct) return direct

  const nestedAsset = info.asset as JsonRecord | undefined
  const nestedResult = info.result as JsonRecord | undefined
  return safeString(nestedAsset?.id) || safeString(nestedResult?.id) || safeString(nestedResult?.taskId)
}

function computeSourceUrl(request: StockInfoRequest, info: JsonRecord): string | undefined {
  const fromRequest = safeString(request.url)
  const fromInfo =
    safeString(info.url) ||
    safeString(info.link) ||
    safeString(info.downloadUrl) ||
    safeString(info.originalUrl) ||
    safeString(info.source)
  const fallbackSite = request.site && request.id ? `${request.site}:${request.id}` : undefined
  return fromRequest || fromInfo || fallbackSite
}

function normalizeStockInfo(request: StockInfoRequest, info: JsonRecord): StockInfo {
  return {
    site: safeString(info.site) || safeString(info.provider) || request.site,
    assetId: pickAssetId(info) || request.id,
    title: pickTitle(info),
    previewUrl: pickPreviewUrl(info),
    thumbnailUrl: pickThumbnail(info),
    costPoints: determineCostPoints(info),
    costAmount: determineCostAmount(info),
    costCurrency: determineCurrency(info),
    sourceUrl: computeSourceUrl(request, info) || null,
    raw: info,
  }
}

function normalizeOrderResponse(data: JsonRecord) {
  const parsed = OrderResponseSchema.parse(data)
  const downloadUrl =
    parsed.downloadLink || parsed.downloadUrl || parsed.url || parsed.link
  const taskId = parsed.job_id || parsed.task_id
  return {
    success: parsed.success ?? true,
    taskId,
    status: parsed.status,
    message: parsed.message,
    queuedAt: parsed.queued_at,
    actions: parsed.actions,
    downloadUrl,
    raw: data,
  }
}

function normalizeOrderStatus(data: JsonRecord): OrderStatusResponse {
  const parsed = OrderStatusSchema.parse(data)
  return {
    success: parsed.success ?? true,
    status: parsed.status,
    message: typeof parsed.message === 'string' ? parsed.message : undefined,
    progress: parsed.progress ?? null,
    download_url: parsed.download_url,
    details: data,
  }
}

export const nehtwClient = {
  async getSites(signal?: AbortSignal): Promise<StockSite[]> {
    const raw = SitesSchema.parse(await requestJSON<JsonRecord>({ path: '/stocksites', signal }))
    return Object.entries(raw)
      .filter(([key]) => key !== 'notificationChannel')
      .map(([site, value]) => {
        const entry = (typeof value === 'object' && value !== null ? (value as JsonRecord) : {})
        const price = toNumber(entry.price)
        const minPrice = toNumber(entry.minPrice)
        return {
          site,
          displayName: safeString(entry.displayName),
          price: price ?? undefined,
          minPrice: minPrice ?? undefined,
          currency: safeString(entry.currency),
          active: typeof entry.active === 'boolean' ? entry.active : undefined,
          raw: entry,
        }
      })
      .sort((a, b) => a.site.localeCompare(b.site))
  },

  async getStockInfo(request: StockInfoRequest, signal?: AbortSignal): Promise<StockInfo> {
    const { site, id, url, responsetype } = request
    const hasSiteId = Boolean(site && id)
    const path = hasSiteId ? `/stockinfo/${encodeURIComponent(site!)}/${encodeURIComponent(id!)}` : '/stockinfo'
    const searchParams: Record<string, string | number | boolean | undefined> = {
      url,
      site,
      id,
      responsetype,
    }
    const data = StockInfoSchema.parse(
      await requestJSON<JsonRecord>({ path, searchParams, signal })
    )
    return normalizeStockInfo(request, data)
  },

  async createOrder(request: CreateOrderRequest, signal?: AbortSignal) {
    const { site, id, url, responsetype, notification_channel } = request

    const encodedSite = encodeURIComponent(site ?? '')
    const encodedId = encodeURIComponent(id ?? '')
    const basePath = `${NEHTW_BASE_URL}/stockorder/${encodedSite}/${encodedId}`
    const reqUrl = new URL(basePath)

    if (url) {
      reqUrl.searchParams.set('url', url)
    }
    if (responsetype) {
      reqUrl.searchParams.set('responsetype', responsetype)
    }
    if (notification_channel) {
      reqUrl.searchParams.set('notification_channel', notification_channel)
    }

    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
    }
    if (NEHTW_API_KEY) {
      headers['X-Api-Key'] = NEHTW_API_KEY
    }

    // eslint-disable-next-line no-console
    console.log(`[nehtw] createOrder request: GET ${reqUrl.toString()}`)

    const response = await fetch(reqUrl.toString(), {
      method: 'GET',
      headers,
      signal,
    })

    const errorBody = response.ok ? undefined : await response.text()
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`[nehtw] createOrder failed (${response.status}): ${errorBody ?? '<empty>'}`)
      try {
        const parsedError = errorBody ? JSON.parse(errorBody) : undefined
        throw new Error(
          `Upstream API request failed: ${response.statusText} - ${
            (parsedError && typeof parsedError.message === 'string' && parsedError.message) || errorBody || 'Unknown error'
          }`,
        )
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.startsWith('Upstream API request failed:')) {
          throw parseError
        }
        throw new Error(`Upstream API request failed: ${response.statusText} - ${errorBody ?? 'Unknown error'}`)
      }
    }

    const raw = (await response.json()) as JsonRecord
    if (raw.error === true || raw.success === false) {
      const errorMsg = String(
        raw.message ||
          raw.data ||
          (typeof raw.error === 'string' ? raw.error : '') ||
          'Unknown error',
      )
      // eslint-disable-next-line no-console
      console.error('[nehtw] createOrder reported failure:', raw)
      throw new Error(`Nehtw API reported failure: ${errorMsg}`)
    }

    // eslint-disable-next-line no-console
    console.log('[nehtw] createOrder success:', raw)

    return normalizeOrderResponse(raw)
  },

  async getOrderStatus(taskId: string, responsetype?: string, signal?: AbortSignal): Promise<OrderStatusResponse> {
    const searchParams: Record<string, string | undefined> = {
      responsetype,
    }
    const data = await requestJSON<JsonRecord>({
      path: `/order/${encodeURIComponent(taskId)}/status`,
      searchParams,
      signal,
    })
    return normalizeOrderStatus(data)
  },

  async confirmOrder(taskId: string, responsetype?: string, signal?: AbortSignal): Promise<ConfirmOrderResponse> {
    const searchParams: Record<string, string | undefined> = {
      responsetype,
    }
    const data = await requestJSON<JsonRecord>({
      path: `/order/${encodeURIComponent(taskId)}/confirm`,
      searchParams,
      signal,
    })
    const normalized = normalizeOrderResponse(data)
    return {
      success: normalized.success,
      message: normalized.message,
      download_url: normalized.downloadUrl,
    }
  },

  async downloadOrder(taskId: string, responsetype?: string, signal?: AbortSignal): Promise<DownloadOrderResponse> {
    const searchParams = {
      responsetype,
      responseType: responsetype,
    }
    const data = await requestJSON<JsonRecord>({
      path: `/v2/order/${encodeURIComponent(taskId)}/download`,
      searchParams,
      signal,
    })
    const parsed = DownloadSchema.parse(data)
    const downloadUrl = parsed.downloadLink || parsed.downloadUrl || parsed.url || parsed.link
    return {
      success: Boolean(downloadUrl),
      downloadUrl,
      fileName: parsed.fileName,
      raw: data,
    }
  },
}

export type { StockInfo, StockSite, OrderStatusResponse }
