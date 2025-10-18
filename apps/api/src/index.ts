import express from 'express'
import cors from 'cors' // Import the cors package
import stockRoutes from './routes/stock'
import db from './db' // Corrected the import statement

const app = express()
const port = process.env.PORT || 4000

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
app.use('/api/stock', stockRoutes)

// Test database connection
app.get('/api/health/db', async (req, res) => {
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

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Database operations will fail.');
  }
  if (!process.env.NEHTW_API_KEY) {
    console.warn('[stock] NEHTW_API_KEY is not set. Stock routes will fail until configured.');
  }
});

