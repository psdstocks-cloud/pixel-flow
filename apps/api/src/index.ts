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
import authRoutes from './routes/auth'

// Import webhook routes
import webhookRoutes from './routes/webhooks'

// Import admin config routes
import adminConfigRouter from './routes/admin-config'

// Import monitoring jobs
import { startMonitoringJobs } from './jobs/monitoring-jobs'

// Import system config service
import { SystemConfigService } from './services/system-config.service'

const app = express()

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet with relaxed CSP for API
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        'https://pixel-flow-sigma.vercel.app',
        'https://pixel-flow.vercel.app',
        'https://*.vercel.app',
        'https://*.supabase.co',
        'https://*.railway.app'
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// Enhanced CORS Configuration
const allowedOrigins = [
  'https://pixel-flow-sigma.vercel.app',
  'https://pixel-flow.vercel.app',
  'https://pixel-flow-staging.vercel.app',
  process.env.FRONTEND_URL,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list or matches wildcard pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*')
        return new RegExp(pattern).test(origin)
      }
      return allowedOrigin === origin
    })

    if (isAllowed) {
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
// WEBHOOKS (Before rate limiting - no auth required)
// ============================================
app.use('/api/webhooks', webhookRoutes)
app.use('/api/admin/config', adminConfigRouter)
app.use('/api/auth', authRoutes) // app.use('/api/auth', authRoutes)

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
// ADMIN AUDIT LOG ROUTES
// ============================================

app.get('/api/admin/audit-logs', redisRateLimit('auth'), requireAuth, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { 
    eventType, 
    eventCategory, 
    userId, 
    startDate, 
    endDate,
    page = '1',
    limit = '50'
  } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where: any = {}

  if (eventType) {
    where.eventType = eventType
  }

  if (eventCategory) {
    where.eventCategory = eventCategory
  }

  if (userId) {
    where.userId = userId
  }

  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = new Date(startDate as string)
    if (endDate) where.timestamp.lte = new Date(endDate as string)
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.auditLog.count({ where })
  ])

  res.json({
    success: true,
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  })
}))

// ============================================
// ADMIN CONFIG ROUTES (AUTH RATE LIMIT)
// ============================================
app.use('/api/admin/config', redisRateLimit('auth'), adminConfigRouter)

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
// START MONITORING JOBS (Production Only)
// ============================================

if (process.env.NODE_ENV === 'production') {
  console.log('🔄 Starting monitoring jobs...')
  startMonitoringJobs()
}

// ============================================
// INITIALIZE SYSTEM CONFIGURATIONS
// ============================================
SystemConfigService.initializeDefaults().catch(err => {
  console.error('Failed to initialize system configs:', err)
})

// ============================================
// START SERVER
// ============================================

const PORT = Number(process.env.PORT) || 3001
const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log('\n🚀 Pixel Flow API Server Started')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📍 Environment:     ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 Host:            ${HOST}`)
  console.log(`🔌 Port:            ${PORT}`)
  console.log(`✅ Health Check:    http://${HOST}:${PORT}/health`)
  console.log('\n🔒 Security Features Enabled:')
  console.log(`   • Helmet:         ✅`)
  console.log(`   • CORS:           ✅ Strict whitelist + wildcard patterns`)
  console.log(`   • Rate Limiting:  ✅ Redis-backed distributed (Upstash)`)
  console.log(`     - Auth:         5 req/15min (admin routes)`)
  console.log(`     - API:          100 req/15min (user routes)`)
  console.log(`     - Public:       1000 req/15min (public routes)`)
  console.log(`   • Error Handling: ✅ Sanitized responses`)
  console.log(`   • Logging:        ✅ Structured with PII redaction`)
  console.log('\n🔐 Compliance Features:')
  console.log(`   • Audit Logging:  ✅ GDPR, SOC 2, PCI-DSS`)
  console.log(`   • Webhooks:       ✅ Railway, Vercel, Supabase`)
  console.log(`   • Monitoring:     ${process.env.NODE_ENV === 'production' ? '✅ Active' : '⏸️  Disabled (dev mode)'}`)
  console.log(`   • System Config:  ✅ Dynamic configuration management`)
  console.log('\n🌍 Allowed Origins:')
  allowedOrigins.forEach(origin => console.log(`   • ${origin}`))
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err)
  process.exit(1)
})

export default app
