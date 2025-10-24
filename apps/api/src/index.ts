import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { requireAuth, requireRole } from './middleware/auth'
import { prisma } from '@pixel-flow/database'
import paymentsRouter from './routes/payments'

const app = express()

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
// Rate limiting - inline to avoid TypeScript issues
// Rate limiting - type assertion for TypeScript compatibility
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later'
}) as any)


// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ============================================
// HEALTH CHECK ENDPOINTS

app.use(express.urlencoded({ extended: true }))

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pixel-flow-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pixel-flow-api',
    timestamp: new Date().toISOString(),
  })
})

// ============================================
// PAYMENT ROUTES
// ============================================

app.use('/api/payments', paymentsRouter)

// ============================================
// USER ROUTES
// ============================================

// Get user profile
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.user!.id },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        balance: true
      }
    })
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }
    
    res.json({ success: true, profile })
  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// Update user profile
app.put('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const { fullName, avatarUrl } = req.body

    const profile = await prisma.profile.update({
      where: { id: req.user!.id },
      data: {
        fullName,
        avatarUrl
      }
    })

    res.json({ success: true, profile })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Get user orders
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: {
        asset: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    res.json({ success: true, orders })
  } catch (error) {
    console.error('Orders fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// Get user downloads
app.get('/api/downloads', requireAuth, async (req, res) => {
  try {
    const downloads = await prisma.download.findMany({
      where: { 
        userId: req.user!.id,
        expiresAt: { gt: new Date() }
      },
      include: {
        asset: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    res.json({ success: true, downloads })
  } catch (error) {
    console.error('Downloads fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch downloads' })
  }
})

// Get user transactions
app.get('/api/transactions', requireAuth, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    res.json({ success: true, transactions })
  } catch (error) {
    console.error('Transactions fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

// ============================================
// PACKAGE ROUTES
// ============================================

// Get all active packages
app.get('/api/packages', async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: [
        { isPopular: 'desc' },
        { price: 'asc' }
      ]
    })
    
    res.json({ success: true, packages })
  } catch (error) {
    console.error('Packages fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch packages' })
  }
})

// ============================================
// ASSET ROUTES (PUBLIC)
// ============================================

// Get all assets (public catalog)
app.get('/api/assets', async (req, res) => {
  try {
    const { category, search, page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          tags: true,
          thumbnailUrl: true,
          isPremium: true,
          cost: true,
          downloadsCount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.asset.count({ where })
    ])

    res.json({
      success: true,
      assets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Assets fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch assets' })
  }
})

// Get single asset
app.get('/api/assets/:id', async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    res.json({ success: true, asset })
  } catch (error) {
    console.error('Asset fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch asset' })
  }
})

// ============================================
// ADMIN ROUTES
// ============================================

// Get all users (admin only)
app.get('/api/admin/users', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const users = await prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        credits: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            orders: true,
            downloads: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json({ success: true, users })
  } catch (error) {
    console.error('Users fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Get all orders (admin only)
app.get('/api/admin/orders', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        },
        asset: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    res.json({ success: true, orders })
  } catch (error) {
    console.error('Admin orders fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// Update user role (admin only)
app.put('/api/admin/users/:id/role', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const user = await prisma.profile.update({
      where: { id: req.params.id },
      data: { role }
    })

    res.json({ success: true, user })
  } catch (error) {
    console.error('Role update error:', error)
    res.status(500).json({ error: 'Failed to update role' })
  }
})

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString(),
  })
})

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// ============================================
// START SERVER
// ============================================


const PORT = Number(process.env.PORT) || 3001
const HOST = process.env.NODE_ENV === 'production' ? '::' : '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`🚀 API server running on ${HOST}:${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
  console.log(`✅ Health check: http://${HOST}:${PORT}/health`)
})


export default app
