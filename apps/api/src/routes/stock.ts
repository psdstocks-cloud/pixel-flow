import express from 'express'
import { z } from 'zod'

const router = express.Router()

const NEHTW_BASE = 'https://nehtw.com/api'
const API_KEY = process.env.NEHTW_API_KEY

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[stock] NEHTW_API_KEY is not set. Stock routes will fail until configured.')
}

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'pixel-flow/1.0 (+https://github.com/psdstocks-cloud/pixel-flow)',
  Accept: 'application/json, */*;q=0.8',
}

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

async function respondByContentType(r: any, res: express.Response) {
  const contentType = (r.headers?.get && r.headers.get('content-type')) || ''
  if (typeof r.json === 'function' && contentType.includes('application/json')) {
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
  })
  .strict()

function badRequest(res: express.Response, issues: z.ZodIssue[]) {
  return res.status(400).json({ error: 'ValidationError', issues })
}

// GET /stock/sites -> list supported sites/pricing
router.get('/sites', async (_req, res, next) => {
  try {
    const url = buildUrl('/stocksites')
    const r = await fetch(url as any, { headers: withApiKey() } as any)
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
    const r = await fetch(fullUrl as any, { headers: withApiKey() } as any)
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
    const r = await fetch(fullUrl as any, { headers: withApiKey() } as any)
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
    const r = await fetch(url as any, { headers: withApiKey() } as any)
    return respondByContentType(r, res)
  } catch (err) {
    next(err)
  }
})

// GET /stock/order/:taskId/download?responsetype=any|gdrive|asia|mydrivelink&redirect=true
router.get('/order/:taskId/download', async (req, res, next) => {
  try {
    const { taskId } = req.params
    const parsed = DownloadQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const { responsetype, redirect } = parsed.data
    const url = buildUrl(`/v2/order/${encodeURIComponent(taskId)}/download`, {
      responsetype,
      responseType: responsetype,
    })
    const r = await fetch(url as any, { headers: withApiKey() } as any)

    if (redirect) {
      try {
        const ct = r.headers?.get?.('content-type') || ''
        if (ct.includes('application/json')) {
          const data = await r.json()
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
