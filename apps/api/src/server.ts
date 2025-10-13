import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check - this should work without any external dependencies
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Pixel Flow API is running',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  })
})

// Basic root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Pixel Flow API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// Try to load routes with error handling
try {
  // Import routes dynamically to avoid startup failures
  const authRoutes = require('./modules/auth/auth.routes').default
  const stockRoutes = require('./modules/stock/stock.routes').default
  
  app.use('/api/auth', authRoutes)
  app.use('/api/stock', stockRoutes)
  
  console.log('✅ API routes loaded successfully')
} catch (error) {
  console.warn('⚠️ Some API routes could not be loaded:', error instanceof Error ? error.message : 'Unknown error')
  
  // Add basic error route for missing modules
  app.use('/api/*', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable - some modules could not be loaded'
    })
  })
}

// Basic error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err)
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🚀 Pixel Flow API server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
})