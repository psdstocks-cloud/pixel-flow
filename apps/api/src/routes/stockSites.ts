import { Router } from 'express'
import { authMiddleware, requireNehtwKey } from '../middleware/auth'
import { asyncHandler, APIError } from '../middleware/errorHandler'
import { NehtwAPIClient } from '../utils/nehtwClient'
import { prisma } from '../lib/prisma'

const router = Router()

/**
 * GET /api/stock-sites
 * Fetch and cache stock sites pricing
 */
router.get(
  '/stock-sites',
  authMiddleware,
  requireNehtwKey,
  asyncHandler(async (req, res) => {
    const user = req.user

    if (!user?.nehtwApiKey) {
      throw new APIError('Nehtw API key not configured', 400)
    }

    const client = new NehtwAPIClient(user.nehtwApiKey)
    const sitesData = await client.getStockSites()

    const sites = Object.entries(sitesData).map(([name, info]: [string, any]) => ({
      name,
      active: info?.active !== false,
      price: Number(info?.price ?? 0),
    }))

    await Promise.all(
      sites.map((site) =>
        prisma.stockSite.upsert({
          where: { name: site.name },
          update: {
            active: site.active,
            price: site.price,
          },
          create: site,
        })
      )
    )

    const stockSites = await prisma.stockSite.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })

    res.json({
      success: true,
      sites: stockSites,
      count: stockSites.length,
    })
  })
)

/**
 * GET /api/stock-sites/cached
 * Get cached stock sites (no API call)
 */
router.get(
  '/stock-sites/cached',
  authMiddleware,
  asyncHandler(async (_req, res) => {
    const stockSites = await prisma.stockSite.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })

    res.json({
      success: true,
      sites: stockSites,
      cached: true,
    })
  })
)

export default router
