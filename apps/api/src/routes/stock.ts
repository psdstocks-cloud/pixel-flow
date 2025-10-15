import express from 'express'
import { Readable } from 'stream'
import { z } from 'zod'
import type { Response } from 'undici'
import type { ReadableStream } from 'node:stream/web'

const router = express.Router()

const NEHTW_BASE = 'https://nehtw.com/api'
const API_KEY = process.env.NEHTW_API_KEY

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[stock] NEHTW_API_KEY is not set. Stock routes will fail until configured.')
}

type DownloadResponse = {
  downloadLink?: string
  link?: string
  url?: string
  downloadUrl?: string
  fileName?: string
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

async function respondByContentType(r: Response, res: express.Response) {
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

function badRequest(res: express.Response, issues: z.ZodIssue[]) {
  return res.status(400).json({ error: 'ValidationError', issues })
}

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
            const body: ReadableStream<Uint8Array> | null = fileResp.body
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