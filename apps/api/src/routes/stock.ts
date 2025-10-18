import express from 'express'
import { Readable } from 'stream'
import { z } from 'zod'
import prisma from '../db'

const router = express.Router()

const ALLOWED_ORIGIN = process.env.STOCK_API_ALLOWED_ORIGIN || '*'

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

const NEHTW_BASE = 'https://nehtw.com/api'
const API_KEY = process.env.NEHTW_API_KEY

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[stock] NEHTW_API_KEY is not set. Stock routes will fail until configured.')
}

function formatError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Unexpected error'
  }
}

type DownloadResponse = {
  downloadLink?: string
  link?: string
  url?: string
  downloadUrl?: string
  fileName?: string
}

type FetchResponse = Awaited<ReturnType<typeof fetch>>
type NodeReadableStream = import('node:stream/web').ReadableStream<Uint8Array>

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'pixel-flow/1.0 (+https://github.com/psdstocks-cloud/pixel-flow)',
  Accept: 'application/json, */*;q=0.8',
}

const MAX_BULK_ITEMS = 5

function withApiKey(headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...DEFAULT_HEADERS,
    ...headers,
    'X-Api-Key': API_KEY || '',
  }
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path.startsWith('http') ? path : `${NEHTW_BASE}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function safeString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  return undefined
}

function determineCostPoints(info: Record<string, unknown>): number | null {
  const candidates = [info.points, info.cost, info.price]
  for (const candidate of candidates) {
    const numeric = toNumber(candidate)
    if (numeric !== null) return Math.max(Math.ceil(numeric), 0)
  }
  return null
}

function determineCostAmount(info: Record<string, unknown>): number | null {
  const candidates = [info.cost, info.price]
  for (const candidate of candidates) {
    const numeric = toNumber(candidate)
    if (numeric !== null) return numeric
  }
  return null
}

function determineCurrency(info: Record<string, unknown>): string | undefined {
  return safeString(info.currency) || safeString(info.currencyCode)
}

function pickPreviewUrl(info: Record<string, unknown>): string | undefined {
  return (
    safeString(info.preview) ||
    safeString(info.thumbnail) ||
    safeString(info.thumb) ||
    safeString(info.image) ||
    safeString(info.previewUrl)
  )
}

function pickTitle(info: Record<string, unknown>): string | undefined {
  return (
    safeString(info.title) ||
    safeString(info.name) ||
    safeString(info.filename) ||
    safeString(info.fileName) ||
    safeString(info.message)
  )
}

function pickThumbnail(info: Record<string, unknown>): string | undefined {
  return safeString(info.thumbnail) || safeString(info.thumb) || safeString(info.previewThumb) || pickPreviewUrl(info)
}

function pickAssetId(info: Record<string, unknown>): string | undefined {
  const direct =
    safeString(info.assetId) ||
    safeString(info.stockId) ||
    safeString(info.asset) ||
    safeString(info.fileId)
  if (direct) return direct

  const nestedAsset = info.asset as Record<string, unknown> | undefined
  const nestedResult = info.result as Record<string, unknown> | undefined
  return (
    safeString(info.id) ||
    safeString(nestedAsset?.id) ||
    safeString(nestedResult?.id) ||
    safeString(nestedResult?.taskId)
  )
}

function computeSourceUrl(item: MultiLinkItem, info?: Record<string, unknown>): string {
  const fromItem = item.url ? safeString(item.url) : undefined
  const fromInfo = info
    ? safeString(info.url) ||
      safeString(info.link) ||
      safeString(info.downloadUrl) ||
      safeString(info.originalUrl)
    : undefined
  const fallbackSite = item.site && item.id ? `${item.site}:${item.id}` : undefined
  return fromItem ?? fromInfo ?? fallbackSite ?? ''
}

function extractTaskIdFromResponse(data: Record<string, unknown>): string | null {
  const candidates: Array<unknown> = [
    data.taskId,
    data.taskID,
    data.id,
    data.task,
    (data.task as Record<string, unknown> | undefined)?.id,
    (data.task as Record<string, unknown> | undefined)?.taskId,
    (data.result as Record<string, unknown> | undefined)?.taskId,
    (data.result as Record<string, unknown> | undefined)?.id,
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

function resolveSite(item: MultiLinkItem, info?: Record<string, unknown>): string | undefined {
  return item.site ?? (info ? safeString(info.site) : undefined)
}

async function getOrCreateUserBalance(userId: string) {
  return prisma.userBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
}

type StockOrderTaskModel = Awaited<ReturnType<typeof prisma.stockOrderTask.findMany>>[number]

const HTTP_URL_REGEX = /^https?:\/\//i

function formatTaskResponse(task: StockOrderTaskModel) {
  return {
    taskId: task.id,
    externalTaskId: task.externalTaskId,
    status: task.status,
    title: task.title,
    previewUrl: task.previewUrl,
    thumbnailUrl: task.thumbnailUrl,
    costPoints: task.costPoints ?? undefined,
    costAmount: task.costAmount ?? undefined,
    costCurrency: task.costCurrency ?? undefined,
    latestMessage: task.latestMessage ?? undefined,
    downloadUrl: task.downloadUrl ?? undefined,
    site: task.site ?? undefined,
    assetId: task.assetId ?? undefined,
    responsetype: task.responsetype ?? undefined,
    batchId: task.batchId ?? undefined,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    sourceUrl: task.sourceUrl,
  }
}

async function fetchInfoForItem(item: MultiLinkItem, responsetype?: string) {
  const hasSiteId = Boolean(item.site && item.id)
  const path = hasSiteId ? `/stockinfo/${encodeURIComponent(item.site!)}/${encodeURIComponent(item.id!)}` : '/stockinfo'
  const queryParams: Record<string, string | number | boolean | undefined> = {}
  if (item.url) queryParams.url = item.url
  if (item.site) queryParams.site = item.site
  if (item.id) queryParams.id = item.id
  if (responsetype) queryParams.responsetype = responsetype
  const url = buildUrl(path, queryParams)
  const response = await fetch(url, { headers: withApiKey() })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Failed to fetch stock info (status ${response.status}).`)
  }
  const data = (await response.json()) as Record<string, unknown>
  if (!determineCostPoints(data) && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[stock] Missing cost data for item', {
      site: item.site,
      id: item.id,
      url: item.url,
      response: data,
    })
  }
  return data
}

async function queueStockOrderTask(task: StockOrderTaskModel, responsetype?: string) {
  const hasSiteId = Boolean(task.site && task.assetId)
  const path = hasSiteId
    ? `/stockorder/${encodeURIComponent(task.site!)}/${encodeURIComponent(task.assetId!)}`
    : '/stockorder'
  const queryParams: Record<string, string | number | boolean | undefined> = {
    responsetype,
    responseType: responsetype,
  }
  if (task.sourceUrl && HTTP_URL_REGEX.test(task.sourceUrl)) {
    queryParams.url = task.sourceUrl
  }
  const url = buildUrl(path, queryParams)
  const response = await fetch(url, { headers: withApiKey() })
  const bodyText = await response.text()
  if (!response.ok) {
    throw new Error(bodyText || `Failed to queue stock order (status ${response.status}).`)
  }

  let parsed: Record<string, unknown>
  try {
    parsed = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {}
  } catch {
    parsed = {}
  }

  const externalTaskId = extractTaskIdFromResponse(parsed)
  const latestMessage = safeString(parsed.message) ?? 'Order queued.'
  const candidateDownload =
    safeString(parsed.downloadLink) ||
    safeString(parsed.downloadUrl) ||
    safeString(parsed.url)
  let finalDownload = candidateDownload ?? task.downloadUrl ?? undefined
  const files = Array.isArray(parsed.files) ? (parsed.files as Array<Record<string, unknown>>) : []
  if (!finalDownload && files.length > 0) {
    const firstFileUrl = safeString(files[0]?.url)
    if (firstFileUrl) finalDownload = firstFileUrl
  }

  return {
    parsed,
    externalTaskId,
    latestMessage,
    downloadUrl: finalDownload,
  }
}

async function respondByContentType(r: FetchResponse, res: express.Response) {
  const contentType = r.headers?.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      const data = await r.json()
      return res.status(r.ok ? 200 : r.status).json(data)
    } catch {
      const text = await r.text()
      res.setHeader('content-type', 'text/plain; charset=utf-8')
      return res.status(r.status).send(text)
    }
  }
  const arrayBuf = await r.arrayBuffer()
  const buf = Buffer.from(arrayBuf)
  if (contentType) res.setHeader('content-type', contentType)
  return res.status(r.status).send(buf)
}

// ===== Schemas =====
const ResponseTypeEnum = z.enum(['any', 'gdrive', 'asia', 'mydrivelink']).optional()

const InfoQuerySchema = z
  .object({
    site: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    url: z.string().url().optional(),
  })
  .refine(
    (d) => (d.url && !d.site && !d.id) || (!!d.site && !!d.id && !d.url) || (!!d.url && !!d.site && !!d.id),
    { message: 'Provide either url, or site+id, or all three; but not a single site/id without the other.' }
  )

const OrderBodySchema = z
  .object({
    site: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    url: z.string().url().optional(),
    responsetype: ResponseTypeEnum,
    notificationChannel: z.string().optional(),
  })
  .refine((d) => (!!d.url && !d.site && !d.id) || (!!d.site && !!d.id), {
    message: 'Provide url OR both site and id.',
  })

const StatusQuerySchema = z.object({ responsetype: ResponseTypeEnum }).strict()

const DownloadQuerySchema = z
  .object({
    responsetype: ResponseTypeEnum,
    redirect: z.coerce.boolean().optional(),
    follow: z.coerce.boolean().optional(),
  })
  .strict()

const ConfirmBodySchema = z
  .object({
    responsetype: ResponseTypeEnum,
  })
  .partial()
  .strict()

const MultiLinkItemSchema = z
  .object({
    url: z.string().url().optional(),
    site: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
  })
  .refine((data) => Boolean(data.url) || (Boolean(data.site) && Boolean(data.id)), {
    message: 'Provide a direct url or both site and id.',
  })

const PreviewRequestSchema = z
  .object({
    userId: z.string().min(1),
    responsetype: ResponseTypeEnum.optional(),
    items: z.array(MultiLinkItemSchema).min(1).max(MAX_BULK_ITEMS),
  })
  .strict()

const OrderCommitSchema = z
  .object({
    userId: z.string().min(1),
    responsetype: ResponseTypeEnum.optional(),
    taskIds: z.array(z.string().min(1)).min(1),
  })
  .strict()

const BalanceAdjustSchema = z
  .object({
    deltaPoints: z.number().int(),
  })
  .strict()

const TaskListQuerySchema = z
  .object({
    userId: z.string().min(1),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict()

type MultiLinkItem = z.infer<typeof MultiLinkItemSchema>

function badRequest(res: express.Response, issues: z.ZodIssue[]) {
  return res.status(400).json({ error: 'ValidationError', issues })
}

router.get('/balance/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    if (!userId) return badRequest(res, [{ message: 'Missing userId', path: ['userId'], code: 'custom' } as z.ZodIssue])
    const balance = await getOrCreateUserBalance(userId)
    return res.json({ userId, points: balance.points, updatedAt: balance.updatedAt.toISOString() })
  } catch (err) {
    next(err)
  }
})

router.post('/balance/:userId/adjust', async (req, res, next) => {
  try {
    const { userId } = req.params
    if (!userId) return badRequest(res, [{ message: 'Missing userId', path: ['userId'], code: 'custom' } as z.ZodIssue])
    const parsed = BalanceAdjustSchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const balance = await getOrCreateUserBalance(userId)
    const nextPoints = Math.max(balance.points + parsed.data.deltaPoints, 0)
    const updated = await prisma.userBalance.update({ where: { userId }, data: { points: nextPoints } })
    return res.json({ userId, points: updated.points, updatedAt: updated.updatedAt.toISOString() })
  } catch (err) {
    next(err)
  }
})

router.get('/tasks', async (req, res, next) => {
  try {
    const parsed = TaskListQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const { userId, limit = 25 } = parsed.data
    const tasks = await prisma.stockOrderTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return res.json({ tasks: tasks.map(formatTaskResponse) })
  } catch (err) {
    next(err)
  }
})

router.post('/order/preview', async (req, res, next) => {
  try {
    const parsed = PreviewRequestSchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const { userId, items, responsetype } = parsed.data

    const balance = await getOrCreateUserBalance(userId)
    const previewResults: Array<{ task?: ReturnType<typeof formatTaskResponse>; error?: string }> = []

    for (const item of items) {
      try {
        const info = await fetchInfoForItem(item, responsetype)
        const costPoints = determineCostPoints(info)
        const costAmount = determineCostAmount(info)
        const costCurrency = determineCurrency(info)
        const title = pickTitle(info)
        const previewUrl = pickPreviewUrl(info)
        const thumbnailUrl = pickThumbnail(info)
        const assetId = pickAssetId(info)
        const site = resolveSite(item, info)
        const sourceUrl = computeSourceUrl(item, info)

        const created = await prisma.stockOrderTask.create({
          data: {
            userId,
            sourceUrl,
            site,
            assetId,
            title,
            previewUrl,
            thumbnailUrl,
            costPoints: costPoints ?? undefined,
            costAmount: costAmount ?? undefined,
            costCurrency: costCurrency ?? undefined,
            status: 'preview',
            latestMessage: 'Ready to order.',
            responsetype,
          },
        })

        previewResults.push({ task: formatTaskResponse(created) })
      } catch (error) {
        previewResults.push({ error: formatError(error) })
      }
    }

    return res.json({ balance: { userId, points: balance.points }, results: previewResults })
  } catch (err) {
    next(err)
  }
})

router.post('/order/commit', async (req, res, next) => {
  try {
    const parsed = OrderCommitSchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const { userId, taskIds, responsetype } = parsed.data

    const tasks = await prisma.stockOrderTask.findMany({
      where: {
        id: { in: taskIds },
        userId,
      },
    })

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'No tasks found for provided identifiers.' })
    }

    const costByTask = new Map<string, number>()
    let totalRequestedPoints = 0
    for (const task of tasks) {
      const cost = task.costPoints ?? 0
      costByTask.set(task.id, cost)
      totalRequestedPoints += cost
    }

    const balance = await getOrCreateUserBalance(userId)
    if (balance.points < totalRequestedPoints) {
      return res.status(400).json({
        error: 'InsufficientBalance',
        availablePoints: balance.points,
        requiredPoints: totalRequestedPoints,
      })
    }

    const successes: Array<ReturnType<typeof formatTaskResponse>> = []
    const failures: Array<{ taskId: string; error: string }> = []
    let pointsToDeduct = 0

    for (const task of tasks) {
      try {
        const queueResult = await queueStockOrderTask(task, responsetype ?? task.responsetype ?? undefined)
        const updated = await prisma.stockOrderTask.update({
          where: { id: task.id },
          data: {
            status: 'queued',
            externalTaskId: queueResult.externalTaskId ?? task.externalTaskId,
            latestMessage: queueResult.latestMessage,
            downloadUrl: queueResult.downloadUrl ?? task.downloadUrl,
            responsetype: responsetype ?? task.responsetype ?? undefined,
          },
        })
        successes.push(formatTaskResponse(updated))
        pointsToDeduct += costByTask.get(task.id) ?? 0
      } catch (error) {
        const message = formatError(error)
        const updated = await prisma.stockOrderTask.update({
          where: { id: task.id },
          data: {
            status: 'error',
            latestMessage: message,
          },
        })
        failures.push({ taskId: task.id, error: message })
        successes.push(formatTaskResponse(updated))
      }
    }

    if (pointsToDeduct > 0) {
      await prisma.userBalance.update({
        where: { userId },
        data: { points: Math.max(balance.points - pointsToDeduct, 0) },
      })
    }

    const updatedBalance = await prisma.userBalance.findUnique({ where: { userId } })

    return res.json({
      balance: { userId, points: updatedBalance?.points ?? 0 },
      tasks: successes,
      failures,
      pointsDeducted: pointsToDeduct,
    })
  } catch (err) {
    next(err)
  }
})
// GET /stock/sites -> list supported sites/pricing
router.get('/sites', async (_req, res, next) => {
  try {
    const url = buildUrl('/stocksites')
    const r = await fetch(url, { headers: withApiKey() })
    return respondByContentType(r, res)
  } catch (err) {
    next(err)
  }
})

// GET /stock/info?site=...&id=...&url=...
router.get('/info', async (req, res, next) => {
  try {
    const parsed = InfoQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const { site, id, url } = parsed.data
    const path = site && id ? `/stockinfo/${encodeURIComponent(site)}/${encodeURIComponent(id)}` : '/stockinfo'
    const fullUrl = buildUrl(path, { url })
    const r = await fetch(fullUrl, { headers: withApiKey() })
    return respondByContentType(r, res)
  } catch (err) {
    next(err)
  }
})

// POST /stock/order { site, id, url, responsetype, notificationChannel? }
router.post('/order', async (req, res, next) => {
  try {
    const parsed = OrderBodySchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const { site, id, url, responsetype, notificationChannel } = parsed.data
    const notify = notificationChannel || process.env.NEHTW_NOTIFY

    const path = site && id ? `/stockorder/${encodeURIComponent(site)}/${encodeURIComponent(id)}` : '/stockorder'
    const fullUrl = buildUrl(path, {
      url,
      responsetype,
      responseType: responsetype,
      notificationChannel: notify,
    })

    // Upstream only supports GET; send as query params
    const r = await fetch(fullUrl, { headers: withApiKey() })
    return respondByContentType(r, res)
  } catch (err) {
    next(err)
  }
})

// GET /stock/order/:taskId/status?responsetype=...
router.get('/order/:taskId/status', async (req, res, next) => {
  try {
    const { taskId } = req.params
    const parsed = StatusQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const { responsetype } = parsed.data
    const url = buildUrl(`/order/${encodeURIComponent(taskId)}/status`, {
      responsetype,
      responseType: responsetype,
    })
    const r = await fetch(url, { headers: withApiKey() })
    return respondByContentType(r, res)
  } catch (err) {
    next(err)
  }
})

// POST /stock/order/:taskId/confirm { responsetype? }
router.post('/order/:taskId/confirm', async (req, res, next) => {
  try {
    const { taskId } = req.params
    const parsed = ConfirmBodySchema.safeParse(req.body ?? {})
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const { responsetype } = parsed.data
    const url = buildUrl(`/order/${encodeURIComponent(taskId)}/confirm`, {
      responsetype,
      responseType: responsetype,
    })
    const r = await fetch(url, { headers: withApiKey() })
    return respondByContentType(r, res)
  } catch (err) {
    next(err)
  }
})

// GET /stock/order/:taskId/download?responsetype=any|gdrive|asia|mydrivelink&redirect=true&follow=true
router.get('/order/:taskId/download', async (req, res, next) => {
  try {
    const { taskId } = req.params
    const parsed = DownloadQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const { responsetype, redirect, follow } = parsed.data
    const url = buildUrl(`/v2/order/${encodeURIComponent(taskId)}/download`, {
      responsetype,
      responseType: responsetype,
    })
    const r = await fetch(url, { headers: withApiKey() })

    // If follow=true, extract link and stream file back via this server (with headers)
    if (follow) {
      try {
        const ct = r.headers?.get('content-type') || ''
        if (ct.includes('application/json')) {
          const clone = r.clone()
          const data = (await clone.json()) as DownloadResponse
          const link: string | undefined =
            data?.downloadLink || data?.link || data?.url || data?.downloadUrl
          if (link) {
            const fileResp = await fetch(link)

            // Mirror CDN headers
            const fileCT = fileResp.headers?.get('content-type') || ''
            const fileCL = fileResp.headers?.get('content-length') || ''

            // Set content-disposition when we know the file name
            const fname = data?.fileName
            if (fname) {
              res.setHeader('content-disposition', `attachment; filename="${fname}"`)
            }
            if (fileCT) res.setHeader('content-type', fileCT)
            if (fileCL) res.setHeader('content-length', fileCL)

            // Stream the response if supported
            const body = fileResp.body as unknown as NodeReadableStream | null
            try {
              const fromWeb = typeof Readable.fromWeb === 'function' ? Readable.fromWeb : null
              if (body && fromWeb) {
                const nodeStream = fromWeb(body)
                res.status(fileResp.status)
                return nodeStream.pipe(res)
              }
            } catch {
              // fall through to buffered responder
            }

            // Fallback: buffer then respond
            return respondByContentType(fileResp, res)
          }
        }
      } catch {
        // fall through to default responder
      }
    }

    // If redirect=true, 302 to the direct link
    if (redirect) {
      try {
        const ct = r.headers?.get('content-type') || ''
        if (ct.includes('application/json')) {
          const data = (await r.json()) as DownloadResponse
          const link: string | undefined =
            data?.downloadLink || data?.link || data?.url || data?.downloadUrl
          if (link) return res.redirect(302, link)
        }
      } catch {
        // fall through to default responder
      }
    }

    return respondByContentType(r, res)
  } catch (err) {
    next(err)
  }
})

export default router
