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

// Helmet - Security headers
app.use(helmet())

// Enhanced CORS Configuration - SECURE
const allowedOrigins = [
  'https://pixel-flow.vercel.app',                    // Production
  'https://pixel-flow-staging.vercel.app',            // Staging (if you have one)
  process.env.FRONTEND_URL,                            // Dynamic from env
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,  // Local dev
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null   // Local API testing
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true)
    }
    
    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`🚫 CORS blocked request from: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,                                  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400                                       // Cache preflight for 24 hours
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ============================================
// RATE LIMITING
// ============================================

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts for auth endpoints
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
}) as any  // Type assertion to bypass Express type conflicts

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests for general API
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
}) as any  // Type assertion to bypass Express type conflicts

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
// PAYMENT ROUTES (with rate limiting)
// ============================================

app.use('/api/payments', apiLimiter, paymentsRouter)

// ============================================
// USER ROUTES (with rate limiting)
// ============================================

// Get user profile
app.get('/api/user/profile', apiLimiter, requireAuth, async (req, res) => {
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
app.put('/api/user/profile', apiLimiter, requireAuth, async (req, res) => {
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
app.get('/api/orders', apiLimiter, requireAuth, async (req, res) => {
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
app.get('/api/downloads', apiLimiter, requireAuth, async (req, res) => {
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
app.get('/api/transactions', apiLimiter, requireAuth, async (req, res) => {
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
app.get('/api/packages', apiLimiter, async (req, res) => {
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
app.get('/api/assets', apiLimiter, async (req, res) => {
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
app.get('/api/assets/:id', apiLimiter, async (req, res) => {
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
// ADMIN ROUTES (with strict auth rate limiting)
// ============================================

// Get all users (admin only)
app.get('/api/admin/users', authLimiter, requireAuth, requireRole(['admin']), async (req, res) => {
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
app.get('/api/admin/orders', authLimiter, requireAuth, requireRole(['admin']), async (req, res) => {
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
app.put('/api/admin/users/:id/role', authLimiter, requireAuth, requireRole(['admin']), async (req, res) => {
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
    method: req.method,
    timestamp: new Date().toISOString(),
  })
})

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error server-side
  console.error('Unhandled error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip
  })

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS Error',
      message: 'Origin not allowed. Please contact support.',
      allowedOrigins: process.env.NODE_ENV === 'development' ? allowedOrigins : undefined
    })
  }

  // Generic error response (never expose internal errors in production)
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
  console.log('\n🚀 Pixel Flow API Server Started')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📍 Environment:     ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 Host:            ${HOST}`)
  console.log(`🔌 Port:            ${PORT}`)
  console.log(`✅ Health Check:    http://${HOST}:${PORT}/health`)
  console.log('\n🔒 Security Features Enabled:')
  console.log(`   • Helmet:         ✅`)
  console.log(`   • CORS:           ✅ Strict whitelist`)
  console.log(`   • Rate Limiting:  ✅ Auth: 5/15min, API: 100/15min`)
  console.log('\n🌍 Allowed Origins:')
  allowedOrigins.forEach(origin => console.log(`   • ${origin}`))
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err)
  process.exit(1)
})

export default app
