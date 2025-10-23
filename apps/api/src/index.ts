import express, { type Application } from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { errorHandler } from './middleware/errorHandler'

// Import routes
import stockSitesRouter from './routes/stockSites'
import ordersRouter from './routes/orders'

const app: Application = express()
const PORT = process.env.PORT || 3001
const prisma = new PrismaClient()

// ============================================
// MIDDLEWARE
// ============================================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// ============================================
// ROUTES
// ============================================
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

app.use('/api', stockSitesRouter)
app.use('/api', ordersRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  })
})

// ============================================
// ERROR HANDLER (Must be last)
// ============================================
app.use(errorHandler)

// ============================================
// SERVER START
// ============================================
async function startServer() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected')

    app.listen(PORT, () => {
      console.log(`✅ API server running on port ${PORT}`)
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`   URL: http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...')
  await prisma.$disconnect()
  process.exit(0)
})

void startServer()