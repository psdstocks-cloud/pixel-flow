import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// ===== CORS CONFIGURATION =====
// Get allowed origins from environment variable or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://pixel-flow-sigma.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// ===== CONFIGURATION =====
const PORT = Number(process.env.PORT) || 3001;
const NEHTW_API_KEY = process.env.NEHTW_API_KEY || '';

// Log configuration
if (!process.env.NEHTW_API_KEY) {
  console.warn('⚠️ NEHTW_API_KEY not set in environment, using fallback');
}
console.log(`✅ nehtw API configured with key: ${NEHTW_API_KEY.substring(0, 8)}...`);

// ===== HEALTH CHECK ENDPOINTS =====
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pixel-flow-api',
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pixel-flow-api',
    timestamp: new Date().toISOString(),
  });
});

// ===== API ROUTES =====

// Packages API
app.get('/api/packages', (req: Request, res: Response) => {
  try {
    console.log('📦 Packages API called from:', req.headers.origin);
    
    // Your packages logic here
    res.json({
      message: 'Packages endpoint',
      data: [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch packages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Orders API
app.get('/api/orders', (req: Request, res: Response) => {
  try {
    console.log('📦 Orders API called from:', req.headers.origin);
    
    res.json({
      message: 'Orders endpoint',
      data: [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/orders', (req: Request, res: Response) => {
  try {
    console.log('💳 Create order called from:', req.headers.origin);
    
    res.status(201).json({
      message: 'Order created',
      data: req.body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== ERROR HANDLING =====
// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`💳 Packages API: http://localhost:${PORT}/api/packages`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

export default app;
