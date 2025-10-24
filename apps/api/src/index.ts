import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { requireAuth, requireRole } from './middleware/auth'
import { redisRateLimit } from './middleware/redis-rate-limit'
import { errorHandler } from './middleware/error-handler'
import { asyncHandler } from './lib/async-handler'
import { NotFoundError, BadRequestError, ValidationError } from './lib/errors'
import { prisma } from '@pixel-flow/database'
import paymentsRouter from './routes/payments'

const app = express()

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet())

// Enhanced CORS Configuration
const allowedOrigins = [
  'https://pixel-flow.vercel.app',
  'https://pixel-flow-staging.vercel.app',
  process.env.FRONTEND_URL,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`🚫 CORS blocked request from: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ============================================
// HEALTH CHECK ENDPOINTS (PUBLIC RATE LIMIT)
// ============================================

app.get('/', redisRateLimit('public'), (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pixel-flow-api',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  })
})

app.get('/health', redisRateLimit('public'), (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pixel-flow-api',
    timestamp: new Date().toISOString(),
  })
})

// ============================================
// PAYMENT ROUTES (API RATE LIMIT)
// ============================================

app.use('/api/payments', redisRateLimit('api'), paymentsRouter)

// ============================================
// USER ROUTES (API RATE LIMIT) - WITH ERROR HANDLING
// ============================================

app.get('/api/user/profile', redisRateLimit('api'), requireAuth, asyncHandler(async (req, res) => {
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
    throw new NotFoundError('Profile not found')
  }
  
  res.json({ success: true, profile })
}))

app.put('/api/user/profile', redisRateLimit('api'), requireAuth, asyncHandler(async (req, res) => {
  const { fullName, avatarUrl } = req.body

  if (!fullName || fullName.trim().length === 0) {
    throw new ValidationError('Full name is required')
  }

  const profile = await prisma.profile.update({
    where: { id: req.user!.id },
    data: { fullName, avatarUrl }
  })

  res.json({ success: true, profile })
}))

app.get('/api/orders', redisRateLimit('api'), requireAuth, asyncHandler(async (req, res) => {
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
}))

app.get('/api/downloads', redisRateLimit('api'), requireAuth, asyncHandler(async (req, res) => {
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
}))

app.get('/api/transactions', redisRateLimit('api'), requireAuth, asyncHandler(async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 100
  })
  
  res.json({ success: true, transactions })
}))

// ============================================
// PACKAGE ROUTES (PUBLIC) - WITH ERROR HANDLING
// ============================================

app.get('/api/packages', redisRateLimit('public'), asyncHandler(async (req, res) => {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: [
      { isPopular: 'desc' },
      { price: 'asc' }
    ]
  })
  
  res.json({ success: true, packages })
}))

// ============================================
// ASSET ROUTES (PUBLIC) - WITH ERROR HANDLING
// ============================================

app.get('/api/assets', redisRateLimit('public'), asyncHandler(async (req, res) => {
  const { category, search, page = '1', limit = '20' } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)

  if (isNaN(pageNum) || pageNum < 1) {
    throw new ValidationError('Invalid page number')
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new ValidationError('Invalid limit (must be between 1 and 100)')
  }

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
}))

app.get('/api/assets/:id', redisRateLimit('public'), asyncHandler(async (req, res) => {
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
    throw new NotFoundError('Asset not found')
  }

  res.json({ success: true, asset })
}))

// ============================================
// ADMIN ROUTES (AUTH RATE LIMIT - STRICT) - WITH ERROR HANDLING
// ============================================

app.get('/api/admin/users', redisRateLimit('auth'), requireAuth, requireRole(['admin']), asyncHandler(async (req, res) => {
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
}))

app.get('/api/admin/orders', redisRateLimit('auth'), requireAuth, requireRole(['admin']), asyncHandler(async (req, res) => {
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
}))

app.put('/api/admin/users/:id/role', redisRateLimit('auth'), requireAuth, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { role } = req.body

  if (!['user', 'admin'].includes(role)) {
    throw new ValidationError('Invalid role. Must be "user" or "admin"')
  }

  const user = await prisma.profile.update({
    where: { id: req.params.id },
    data: { role }
  })

  res.json({ success: true, user })
}))

// ============================================
// ERROR HANDLING (MUST BE LAST!)
// ============================================

// 404 handler - Must come before global error handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path
  })
})

// Global error handler (MUST BE LAST MIDDLEWARE!)
app.use(errorHandler)

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
  console.log(`   • Rate Limiting:  ✅ Redis-backed distributed (Upstash)`)
  console.log(`     - Auth:         5 req/15min (admin routes)`)
  console.log(`     - API:          100 req/15min (user routes)`)
  console.log(`     - Public:       1000 req/15min (public routes)`)
  console.log(`   • Error Handling: ✅ Sanitized responses`)
  console.log(`   • Logging:        ✅ Structured with PII redaction`)
  console.log('\n🌍 Allowed Origins:')
  allowedOrigins.forEach(origin => console.log(`   • ${origin}`))
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err)
  process.exit(1)
})

export default app
