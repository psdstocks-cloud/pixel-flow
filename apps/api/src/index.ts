console.log('🚀 Starting Pixel Flow API server...')

import express from 'express'
import cors from 'cors'

// --- START DIAGNOSTIC LOGGING ---
// This will help us see if the environment variables are loaded correctly inside the container.
console.log('--- Environment Variables ---')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PORT:', process.env.PORT)
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN)
console.log('NEHTW_API_KEY:', process.env.NEHTW_API_KEY ? 'SET' : 'NOT SET')
console.log('---------------------------')
// --- END DIAGNOSTIC LOGGING ---

const app = express()
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000

// CORS Configuration
const rawOrigins = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000']
const allowedOrigins = rawOrigins
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, '')) // Also remove trailing slashes

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      const normalizedOrigin = origin.replace(/\/$/, '') // Normalize origin from the request
      if (allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true)
      }
      console.error(`CORS Error: Origin ${normalizedOrigin} not allowed.`) // Log CORS errors
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)

app.use(express.json())

// Health check for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Basic API info
app.get('/api/info', (req, res) => {
  res.json({
    status: 'API running',
    timestamp: new Date().toISOString(),
    // For security, avoid sending back sensitive env var values.
    // Just confirm if they are set.
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NEHTW_API_KEY: process.env.NEHTW_API_KEY ? 'SET' : 'NOT SET',
    }
  })
})


// Start server immediately
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ API listening on 0.0.0.0:${port}`)
  console.log(`🔍 Health check available at http://0.0.0.0:${port}/health`)
  console.log(`📊 API info available at http://0.0.0.0:${port}/api/info`)
}).on('error', (error: any) => { // Catch startup errors
  console.error('❌ Failed to start server:', error)
  // Log detailed error information
  console.error('Error details:', {
    code: error.code,
    errno: error.errno,
    syscall: error.syscall,
    address: error.address,
    port: error.port
  })
  process.exit(1) // Exit with an error code
})