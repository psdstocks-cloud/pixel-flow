import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import stockRouter from './routes/stock'

dotenv.config()

const app = express()
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000

// Middleware
app.use(morgan('combined'))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/stock', stockRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'Endpoint not found' })
})

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err)
  const status = err.status || 500
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ API server listening on 0.0.0.0:${port}`)
  console.log(`🩺 Health check: http://localhost:${port}/health`)
  console.log(`📦 Stock API: http://localhost:${port}/stock`)
})