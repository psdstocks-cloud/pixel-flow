import express from 'express'
import { Readable } from 'stream'
import { z } from 'zod'
import prisma from '../db'
import {
  InsufficientBalanceError,
  getOrCreateBalance,
  debitBalance,
  creditBalance,
} from '@pixel-flow/database'
import { nehtwClient } from '../lib/nehtw'
import { requireUser, optionalUser, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

const DEFAULT_NOTIFICATION_CHANNEL = process.env.NEHTW_NOTIFY

// CORS is handled by Express middleware in index.ts
// No need for custom CORS headers here

router.use(optionalUser)

function formatError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Unexpected error'
  }
}

const MAX_BULK_ITEMS = 5

type NodeReadableStream = import('node:stream/web').ReadableStream<Uint8Array>

const ResponseTypeEnum = z.enum(['any', 'gdrive', 'asia', 'mydrivelink']).optional()

const InfoQuerySchema = z
  .object({
    site: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    url: z.string().url().optional(),
    responsetype: ResponseTypeEnum,
  })
  .refine(
    (data) =>
      (data.url && !data.site && !data.id) ||
      (!!data.site && !!data.id && !data.url) ||
      (!!data.url && !!data.site && !!data.id),
    { message: 'Provide either url, site+id, or all three together.' }
  )

const OrderBodySchema = z
  .object({
    userId: z.string().min(1).optional(),
    site: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    url: z.string().url().optional(),
    responsetype: ResponseTypeEnum,
    notificationChannel: z.string().optional(),
  })
  .refine((data) => Boolean(data.url) || (Boolean(data.site) && Boolean(data.id)), {
    message: 'Provide url OR both site and id.',
  })

const StatusQuerySchema = z.object({ responsetype: ResponseTypeEnum }).strict()

const ConfirmBodySchema = z.object({ responsetype: ResponseTypeEnum }).strict()

const DownloadQuerySchema = z
  .object({
    responsetype: ResponseTypeEnum,
    redirect: z.coerce.boolean().optional(),
    follow: z.coerce.boolean().optional(),
  })
  .strict()

const DownloadHistoryQuerySchema = z
  .object({
    userId: z.string().min(1),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .strict()

const RedownloadQuerySchema = z
  .object({
    responsetype: ResponseTypeEnum,
  })
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
    responsetype: ResponseTypeEnum,
    items: z.array(MultiLinkItemSchema).min(1).max(MAX_BULK_ITEMS),
  })
  .strict()

const OrderCommitSchema = z
  .object({
    userId: z.string().min(1),
    responsetype: ResponseTypeEnum,
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

type StockOrderTaskModel = Awaited<ReturnType<typeof prisma.stockOrderTask.findMany>>[number]

type BalancePayload = {
  userId: string
  points: number
}

function badRequest(res: express.Response, issues: z.ZodIssue[]) {
  return res.status(400).json({ error: 'ValidationError', issues })
}

function ensureAuthorizedUser(req: AuthenticatedRequest, userId: string) {
  if (!req.user || req.user.id !== userId) {
    const error = new Error('Cannot act on behalf of another user.') as Error & { status?: number }
    error.status = 403
    throw error
  }
}

function formatTaskResponse(task: StockOrderTaskModel) {
  return {
    taskId: task.id,
    externalTaskId: task.externalTaskId ?? undefined,
    status: task.status,
    title: task.title ?? undefined,
    previewUrl: task.previewUrl ?? undefined,
    thumbnailUrl: task.thumbnailUrl ?? undefined,
    costPoints: task.costPoints ?? undefined,
    costAmount: task.costAmount ?? undefined,
    costCurrency: task.costCurrency ?? undefined,
    latestMessage: task.latestMessage ?? undefined,
    downloadUrl: task.downloadUrl ?? undefined,
    site: task.site ?? undefined,
    assetId: task.assetId ?? undefined,
    responsetype: task.responsetype ?? undefined,
    batchId: task.batchId ?? undefined,
    sourceUrl: task.sourceUrl,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}

function calculateTaskCost(task: StockOrderTaskModel): number {
  return Math.max(task.costPoints ?? 0, 0)
}

function buildCreateOrderPayload(task: StockOrderTaskModel, overrideResponsetype?: string) {
  const isHttpSource = /^https?:\/\//i.test(task.sourceUrl)
  return {
    site: task.site ?? undefined,
    id: task.assetId ?? undefined,
    url: isHttpSource ? task.sourceUrl : undefined,
    responsetype: overrideResponsetype ?? task.responsetype ?? undefined,
    notification_channel: DEFAULT_NOTIFICATION_CHANNEL,
  }
}

async function streamDownload(downloadUrl: string, fileName: string | undefined, res: express.Response) {
  const response = await fetch(downloadUrl)
  const contentType = response.headers?.get('content-type') || ''
  const contentLength = response.headers?.get('content-length') || ''

  if (fileName) {
    res.setHeader('content-disposition', `attachment; filename="${fileName}"`)
  }
  if (contentType) res.setHeader('content-type', contentType)
  if (contentLength) res.setHeader('content-length', contentLength)

  const body = response.body as unknown as NodeReadableStream | null
  const fromWeb = typeof Readable.fromWeb === 'function' ? Readable.fromWeb : null
  if (body && fromWeb) {
    res.status(response.status)
    return fromWeb(body).pipe(res)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  res.status(response.status)
  res.send(buffer)
  return undefined
}

async function formatBalanceResponse(userId: string): Promise<BalancePayload> {
  const balance = await getOrCreateBalance(userId)
  return {
    userId,
    points: balance.points,
  }
}

router.get('/sites', async (_req, res, next) => {
  try {
    const sites = await nehtwClient.getSites()
    return res.json({ sites })
  } catch (err) {
    next(err)
  }
})

router.get('/info', async (req, res, next) => {
  try {
    const parsed = InfoQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const info = await nehtwClient.getStockInfo(parsed.data)
    return res.json({ info })
  } catch (err) {
    next(err)
  }
})

router.get('/balance/:userId', requireUser, async (req, res, next) => {
  try {
    const { userId } = req.params
    const authReq = req as AuthenticatedRequest
    ensureAuthorizedUser(authReq, userId)
    const balance = await getOrCreateBalance(userId)
    return res.json({
      userId,
      points: balance.points,
      updatedAt: balance.updatedAt.toISOString(),
    })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return res.status(403).json({ error: 'Forbidden', message: (err as Error).message })
    }
    next(err)
  }
})

router.post('/balance/:userId/adjust', async (req, res, next) => {
  try {
    const { userId } = req.params
    if (!userId) {
      return badRequest(res, [{ message: 'Missing userId', path: ['userId'], code: 'custom' } as z.ZodIssue])
    }

    const parsed = BalanceAdjustSchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.issues)

    const authReq = req as AuthenticatedRequest
    if (authReq.user && authReq.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Cannot modify another user balance.' })
    }

    const { deltaPoints } = parsed.data
    try {
      const updated =
        deltaPoints >= 0
          ? await creditBalance(userId, deltaPoints)
          : await debitBalance(userId, Math.abs(deltaPoints))
      return res.json({
        userId,
        points: updated.points,
        updatedAt: updated.updatedAt.toISOString(),
      })
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        return res.status(400).json({
          error: 'InsufficientBalance',
          availablePoints: error.availablePoints,
          requiredPoints: error.requiredPoints,
        })
      }
      throw error
    }
  } catch (err) {
    next(err)
  }
})

router.get('/tasks', requireUser, async (req, res, next) => {
  try {
    const parsed = TaskListQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const { userId, limit = 25 } = parsed.data

    const authReq = req as AuthenticatedRequest
    ensureAuthorizedUser(authReq, userId)

    const tasks = await prisma.stockOrderTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return res.json({ tasks: tasks.map(formatTaskResponse) })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return res.status(403).json({ error: 'Forbidden', message: (err as Error).message })
    }
    next(err)
  }
})

router.get('/downloads/history', requireUser, async (req, res, next) => {
  try {
    const parsed = DownloadHistoryQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)

    const { userId, limit = 50, status } = parsed.data
    const authReq = req as AuthenticatedRequest
    ensureAuthorizedUser(authReq, userId)

    const statusList = Array.isArray(status)
      ? status
      : typeof status === 'string' && status.length > 0
        ? status.split(',')
        : undefined

    const tasks = await prisma.stockOrderTask.findMany({
      where: {
        userId,
        ...(statusList && statusList.length > 0
          ? { status: { in: statusList } }
          : { status: { in: ['completed', 'ready', 'queued'] } }),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    return res.json({ downloads: tasks.map(formatTaskResponse) })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return res.status(403).json({ error: 'Forbidden', message: (err as Error).message })
    }
    next(err)
  }
})

router.get('/downloads/:taskId', requireUser, async (req, res, next) => {
  try {
    const parsed = RedownloadQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)

    const authReq = req as AuthenticatedRequest
    const { taskId } = req.params
    const task = await prisma.stockOrderTask.findUnique({ where: { id: taskId } })

    if (!task) {
      return res.status(404).json({ error: 'NotFound', message: 'Task not found.' })
    }

    ensureAuthorizedUser(authReq, task.userId)

    const responsetype = parsed.data.responsetype
    let downloadUrl = task.downloadUrl ?? undefined
    let fileName: string | undefined

    if (!downloadUrl) {
      const upstream = await nehtwClient.downloadOrder(task.externalTaskId ?? taskId, responsetype)
      downloadUrl = upstream.downloadUrl ?? undefined
      fileName = upstream.fileName ?? undefined

      if (downloadUrl) {
        await prisma.stockOrderTask.update({
          where: { id: task.id },
          data: {
            downloadUrl,
          },
        })
      }
    }

    if (!downloadUrl) {
      return res.status(404).json({ error: 'DownloadUnavailable', message: 'No download link available yet.' })
    }

    return res.json({
      download: {
        taskId: task.id,
        downloadUrl,
        fileName,
      },
    })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return res.status(403).json({ error: 'Forbidden', message: (err as Error).message })
    }
    next(err)
  }
})

router.post('/order/preview', requireUser, async (req, res, next) => {
  try {
    const parsed = PreviewRequestSchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.issues)

    const authReq = req as AuthenticatedRequest
    ensureAuthorizedUser(authReq, parsed.data.userId)

    const { userId, items, responsetype } = parsed.data
    const balance = await getOrCreateBalance(userId)
    const previewResults: Array<{ task?: ReturnType<typeof formatTaskResponse>; error?: string }> = []

    for (const item of items) {
      try {
        const info = await nehtwClient.getStockInfo({
          site: item.site,
          id: item.id,
          url: item.url,
          responsetype,
        })

        const sourceUrl = info.sourceUrl ?? item.url ?? (item.site && item.id ? `${item.site}:${item.id}` : '')
        const created = await prisma.stockOrderTask.create({
          data: {
            userId,
            sourceUrl,
            site: info.site ?? item.site ?? undefined,
            assetId: info.assetId ?? item.id ?? undefined,
            title: info.title ?? undefined,
            previewUrl: info.previewUrl ?? undefined,
            thumbnailUrl: info.thumbnailUrl ?? undefined,
            costPoints: info.costPoints ?? undefined,
            costAmount: info.costAmount ?? undefined,
            costCurrency: info.costCurrency ?? undefined,
            status: 'ready',
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
    if ((err as { status?: number }).status === 403) {
      return res.status(403).json({ error: 'Forbidden', message: (err as Error).message })
    }
    next(err)
  }
})

router.post('/order/commit', requireUser, async (req, res, next) => {
  try {
    const parsed = OrderCommitSchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.issues)

    const { userId, taskIds, responsetype } = parsed.data
    const authReq = req as AuthenticatedRequest
    ensureAuthorizedUser(authReq, userId)

    const tasks = await prisma.stockOrderTask.findMany({
      where: {
        id: { in: taskIds },
        userId,
      },
    })

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'No tasks found for provided identifiers.' })
    }

    const costMap = new Map<string, number>()
    let totalRequestedPoints = 0
    for (const task of tasks) {
      const cost = calculateTaskCost(task)
      costMap.set(task.id, cost)
      totalRequestedPoints += cost
    }

    if (totalRequestedPoints > 0) {
      try {
        await debitBalance(userId, totalRequestedPoints)
      } catch (error) {
        if (error instanceof InsufficientBalanceError) {
          return res.status(400).json({
            error: 'InsufficientBalance',
            availablePoints: error.availablePoints,
            requiredPoints: error.requiredPoints,
          })
        }
        throw error
      }
    }

    const updatedTasks: StockOrderTaskModel[] = []
    const failures: Array<{ taskId: string; error: string }> = []
    let refundPoints = 0

    for (const task of tasks) {
      try {
        const upstream = await nehtwClient.createOrder({
          ...buildCreateOrderPayload(task, responsetype ?? task.responsetype ?? undefined),
        })

        const success = upstream.success !== false
        const latestMessage = upstream.message || upstream.status || (success ? 'Queued upstream.' : 'Failed upstream.')
        const updated = await prisma.stockOrderTask.update({
          where: { id: task.id },
          data: {
            status: success ? 'queued' : 'error',
            externalTaskId: upstream.taskId ?? task.externalTaskId ?? undefined,
            latestMessage,
            downloadUrl: upstream.downloadUrl ?? task.downloadUrl ?? undefined,
            responsetype: responsetype ?? task.responsetype ?? undefined,
          },
        })

        if (!success) {
          failures.push({ taskId: task.id, error: latestMessage })
          refundPoints += costMap.get(task.id) ?? 0
        }
        updatedTasks.push(updated)
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
        refundPoints += costMap.get(task.id) ?? 0
        updatedTasks.push(updated)
      }
    }

    if (refundPoints > 0) {
      await creditBalance(userId, refundPoints)
    }

    const balancePayload = await formatBalanceResponse(userId)

    return res.json({
      balance: balancePayload,
      tasks: updatedTasks.map(formatTaskResponse),
      failures,
      pointsDebited: totalRequestedPoints,
      pointsRefunded: refundPoints,
    })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return res.status(403).json({ error: 'Forbidden', message: (err as Error).message })
    }
    next(err)
  }
})

router.post('/order', requireUser, async (req, res, next) => {
  try {
    const parsed = OrderBodySchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.issues)

    const authReq = req as AuthenticatedRequest
    const userId = parsed.data.userId ?? authReq.user!.id
    ensureAuthorizedUser(authReq, userId)

    const { site, id, url, responsetype, notificationChannel } = parsed.data
    const info = await nehtwClient.getStockInfo({ site, id, url, responsetype })

    const sourceUrl = info.sourceUrl ?? url ?? (site && id ? `${site}:${id}` : '')
    const costPoints = Math.max(info.costPoints ?? 0, 0)
    let pointsReserved = 0
    if (costPoints > 0) {
      try {
        await debitBalance(userId, costPoints)
        pointsReserved = costPoints
      } catch (error) {
        if (error instanceof InsufficientBalanceError) {
          return res.status(400).json({
            error: 'InsufficientBalance',
            availablePoints: error.availablePoints,
            requiredPoints: error.requiredPoints,
          })
        }
        throw error
      }
    }

    let task = await prisma.stockOrderTask.create({
      data: {
        userId,
        sourceUrl,
        site: info.site ?? site ?? undefined,
        assetId: info.assetId ?? id ?? undefined,
        title: info.title ?? undefined,
        previewUrl: info.previewUrl ?? undefined,
        thumbnailUrl: info.thumbnailUrl ?? undefined,
        costPoints: info.costPoints ?? undefined,
        costAmount: info.costAmount ?? undefined,
        costCurrency: info.costCurrency ?? undefined,
        status: 'pending',
        latestMessage: 'Submitting upstream order.',
        responsetype,
      },
    })

    try {
      const upstream = await nehtwClient.createOrder({
        site: info.site ?? site,
        id: info.assetId ?? id,
        url: sourceUrl,
        responsetype,
        notification_channel: notificationChannel ?? DEFAULT_NOTIFICATION_CHANNEL,
      })

      const success = upstream.success !== false
      const latestMessage = upstream.message || upstream.status || (success ? 'Queued upstream.' : 'Failed upstream.')
      task = await prisma.stockOrderTask.update({
        where: { id: task.id },
        data: {
          status: success ? 'queued' : 'error',
          externalTaskId: upstream.taskId ?? task.externalTaskId ?? undefined,
          latestMessage,
          downloadUrl: upstream.downloadUrl ?? task.downloadUrl ?? undefined,
        },
      })

      if (!success && pointsReserved > 0) {
        await creditBalance(userId, pointsReserved)
        pointsReserved = 0
      }

      const balancePayload = await formatBalanceResponse(userId)
      return res.json({
        task: formatTaskResponse(task),
        balance: balancePayload,
        upstream,
      })
    } catch (error) {
      const message = formatError(error)
      task = await prisma.stockOrderTask.update({
        where: { id: task.id },
        data: {
          status: 'error',
          latestMessage: message,
        },
      })

      if (pointsReserved > 0) {
        await creditBalance(userId, pointsReserved)
      }

      const balancePayload = await formatBalanceResponse(userId)
      return res.status(502).json({
        error: 'UpstreamFailure',
        message,
        task: formatTaskResponse(task),
        balance: balancePayload,
      })
    }
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return res.status(403).json({ error: 'Forbidden', message: (err as Error).message })
    }
    next(err)
  }
})

router.get('/order/:taskId/status', async (req, res, next) => {
  try {
    const { taskId } = req.params
    const parsed = StatusQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const status = await nehtwClient.getOrderStatus(taskId, parsed.data.responsetype)
    return res.json({ status })
  } catch (err) {
    next(err)
  }
})

router.post('/order/:taskId/confirm', async (req, res, next) => {
  try {
    const { taskId } = req.params
    const parsed = ConfirmBodySchema.safeParse(req.body ?? {})
    if (!parsed.success) return badRequest(res, parsed.error.issues)
    const confirmation = await nehtwClient.confirmOrder(taskId, parsed.data.responsetype)
    return res.json({ confirmation })
  } catch (err) {
    next(err)
  }
})

router.get('/order/:taskId/download', async (req, res, next) => {
  try {
    const { taskId } = req.params
    const parsed = DownloadQuerySchema.safeParse(req.query)
    if (!parsed.success) return badRequest(res, parsed.error.issues)

    const download = await nehtwClient.downloadOrder(taskId, parsed.data.responsetype)
    if (!download.downloadUrl) {
      return res.status(404).json({ error: 'DownloadUnavailable', message: 'No download link available yet.' })
    }

    if (parsed.data.redirect) {
      return res.redirect(download.downloadUrl)
    }

    if (parsed.data.follow) {
      await streamDownload(download.downloadUrl, download.fileName, res)
      return
    }

    return res.json({ download })
  } catch (err) {
    next(err)
  }
})

export default router
