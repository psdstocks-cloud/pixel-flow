import express from 'express';
import cors from 'cors'; // Import the cors package
import stockRoutes from './routes/stock';
import db from './db'; // Corrected the import statement

const app = express();
const port = process.env.PORT || 4000;

// CORS Configuration
// This allows your frontend (Vercel) to communicate with your backend (Railway).
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

app.use(cors(corsOptions)); // Use the cors middleware

app.use(express.json());

// Health check for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Your API routes
app.use('/api/stock', stockRoutes);

// Test database connection
app.get('/api/health/db', async (req, res) => {
  try {
    await db.$connect();
    res.status(200).json({ status: 'ok', message: 'Database connected' });
  } catch (error) {
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

