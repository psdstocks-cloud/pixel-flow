import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import { rateLimitMiddleware } from './middleware/rateLimit'

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

// Rate limiting
app.use(rateLimitMiddleware)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Pixel Flow API is running',
    timestamp: new Date().toISOString()
  })
})

// API routes
import authRoutes from './modules/auth/auth.routes'
import stockRoutes from './modules/stock/stock.routes'

app.use('/api/auth', authRoutes)
app.use('/api/stock', stockRoutes)
// app.use('/api/ai', aiRoutes)
// app.use('/api/background', backgroundRoutes)
// app.use('/api/files', filesRoutes)
// app.use('/api/payment', paymentRoutes)
// app.use('/api/admin', adminRoutes)

// Error handling
app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🚀 Pixel Flow API server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})
