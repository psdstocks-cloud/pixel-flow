console.log('🚀 Starting Pixel Flow API server...')

import express from 'express'
import cors from 'cors'

let stockRoutes
try {
  console.log('📦 Loading stock routes...')
  stockRoutes = require('./routes/stock').default
  console.log('✅ Stock routes loaded successfully')
} catch (error) {
  console.error('❌ Failed to load stock routes:', error instanceof Error ? error.message : String(error))
  stockRoutes = null
}
let db
try {
  console.log('📦 Loading database module...')
  db = require('./db').default
  console.log('✅ Database module loaded successfully')
} catch (error) {
  console.warn('❌ Database module not available:', error instanceof Error ? error.message : String(error))
  db = null
}

const app = express()
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000

// CORS Configuration
// This allows your frontend (Vercel) to communicate with your backend (Railway).
const rawOrigins = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000']
const allowedOrigins = rawOrigins
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ''))

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      const normalizedOrigin = origin.replace(/\/$/, '')
      if (allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
) // Use the cors middleware

app.use(express.json())

// Health check for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Your API routes
if (stockRoutes) {
  app.use('/api/stock', stockRoutes)
} else {
  console.warn('Stock routes not available - API will be limited')
}

// Test database connection
app.get('/api/health/db', async (req, res) => {
  if (!db) {
    return res.status(503).json({ status: 'error', message: 'Database module not available' });
  }
  try {
    await db.$connect();
    res.status(200).json({ status: 'ok', message: 'Database connected' });
  } catch (error) {
    console.error('Database connection check failed', error)
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  } finally {
    await db.$disconnect();
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on 0.0.0.0:${port}`);
  console.log(`Health check available at http://0.0.0.0:${port}/health`);
  console.log(`Environment:`, {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    NEHTW_API_KEY: process.env.NEHTW_API_KEY ? 'SET' : 'NOT SET',
    CORS_ORIGIN: process.env.CORS_ORIGIN
  });
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Database operations will fail.');
  }
  if (!process.env.NEHTW_API_KEY) {
    console.warn('[stock] NEHTW_API_KEY is not set. Stock routes will fail until configured.');
  }
}).on('error', (error: any) => {
  console.error('Failed to start server:', error);
  console.error('Error details:', {
    code: error.code,
    errno: error.errno,
    syscall: error.syscall,
    address: error.address,
    port: error.port
  });
  process.exit(1);
});

