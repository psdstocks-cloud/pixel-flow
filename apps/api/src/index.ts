import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ===== CONFIGURATION =====
// ✅ Convert PORT to number type
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

// Orders API
app.get('/api/orders', (req: Request, res: Response) => {
  // Your orders logic here
  res.json({
    message: 'Orders endpoint',
    data: [],
  });
});

app.post('/api/orders', (req: Request, res: Response) => {
  // Your create order logic here
  res.status(201).json({
    message: 'Order created',
    data: req.body,
  });
});

// Packages API
app.get('/api/packages', (req: Request, res: Response) => {
  // Your packages logic here
  res.json({
    message: 'Packages endpoint',
    data: [],
  });
});

// ===== ERROR HANDLING =====
// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
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
// ✅ Listen on 0.0.0.0 for Railway/Docker compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`💳 Packages API: http://localhost:${PORT}/api/packages`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
