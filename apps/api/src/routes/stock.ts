import express from 'express'

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
    const { site, id, url } = req.query as { site?: string; id?: string; url?: string }
    if (!site && !url) {
      return res.status(400).json({ error: "Missing 'site' or 'url'" })
    }
    const path = site && id ? `/stockinfo/${encodeURIComponent(site)}/${encodeURIComponent(id)}` : '/stockinfo'
    const fullUrl = buildUrl(path, { url })
    const r = await fetch(fullUrl as any, { headers: withApiKey() } as any)
    return respondByContentType(r, res)
  } catch (err) {
    next(err)
  }
})

// POST /stock/order { site, id, url, responsetype }
router.post('/order', async (req, res, next) => {
  try {
    const { site, id, url, responsetype } = req.body as {
      site?: string
      id?: string
      url?: string
      responsetype?: 'any' | 'gdrive' | 'asia' | 'mydrivelink'
    }
    if (!site && !url) {
      return res.status(400).json({ error: "Missing 'site' or 'url'" })
    }
    const path = site && id ? `/stockorder/${encodeURIComponent(site)}/${encodeURIComponent(id)}` : '/stockorder'
    const fullUrl = buildUrl(path, { url, responsetype })
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
    const { responsetype } = req.query as { responsetype?: string }
    const url = buildUrl(`/order/${encodeURIComponent(taskId)}/status`, { responsetype })
    const r = await fetch(url as any, { headers: withApiKey() } as any)
    return respondByContentType(r, res)
  } catch (err) {
    next(err)
  }
})

// GET /stock/order/:taskId/download?responsetype=any|gdrive|asia|mydrivelink
router.get('/order/:taskId/download', async (req, res, next) => {
  try {
    const { taskId } = req.params
    const { responsetype } = req.query as { responsetype?: string }
    const url = buildUrl(`/v2/order/${encodeURIComponent(taskId)}/download`, { responsetype })
    const r = await fetch(url as any, { headers: withApiKey() } as any)
    return respondByContentType(r, res)
  } catch (err) {
    next(err)
  }
})

export default router
