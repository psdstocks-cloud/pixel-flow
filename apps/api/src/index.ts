import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nehtwService from './services/nehtwService';

// Import route modules
import stockRoutes from './routes/stock.routes';
import accountRoutes from './routes/account.routes';

dotenv.config();

const app = express();

// ===== CORS CONFIGURATION =====
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://pixel-flow-sigma.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
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

app.options('*', cors());
app.use(express.json());

// ===== CONFIGURATION =====
const PORT = Number(process.env.PORT) || 3001;
const NEHTW_API_KEY = process.env.NEHTW_API_KEY || '';

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
    version: '1.0.0',
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
// Mount route modules
app.use('/api/stock', stockRoutes);
app.use('/api/account', accountRoutes);

// Legacy routes (for backward compatibility)
app.get('/api/packages', (req: Request, res: Response) => {
  res.json({
    message: 'Packages endpoint',
    data: [],
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/orders', (req: Request, res: Response) => {
  res.json({
    message: 'Orders endpoint',
    data: [],
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/orders', (req: Request, res: Response) => {
  res.status(201).json({
    message: 'Order created',
    data: req.body,
    timestamp: new Date().toISOString(),
  });
});

// ===== ERROR HANDLING =====
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

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
  console.log(`📦 Stock API: http://localhost:${PORT}/api/stock`);
  console.log(`💳 Account API: http://localhost:${PORT}/api/account`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

export default app;


// Get supported stock sites
app.get('/api/stock/sites', async (req: Request, res: Response) => {
  try {
    const sites = await nehtwService.getStockSites();
    res.json({ success: true, data: sites });
  } catch (error) {
    console.error('Error fetching stock sites:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get stock information
app.post('/api/stock/info', async (req: Request, res: Response) => {
  try {
    const { site, id, url } = req.body;
    
    if (!site || !id) {
      return res.status(400).json({ success: false, error: 'Site and ID are required' });
    }
    
    const info = await nehtwService.getStockInfo(site, id, url);
    res.json(info);
  } catch (error) {
    console.error('Error fetching stock info:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Create stock order
app.post('/api/stock/order', async (req: Request, res: Response) => {
  try {
    const { site, id, url } = req.body;
    
    if (!site || !id) {
      return res.status(400).json({ success: false, error: 'Site and ID are required' });
    }
    
    const order = await nehtwService.createOrder(site, id, url);
    
    // TODO: Save order to database
    // await prisma.order.create({ data: { ... } });
    
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Check order status
app.get('/api/stock/status/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const status = await nehtwService.checkOrderStatus(taskId);
    res.json(status);
  } catch (error) {
    console.error('Error checking order status:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Generate download link
app.get('/api/stock/download/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const download = await nehtwService.generateDownloadLink(taskId);
    res.json(download);
  } catch (error) {
    console.error('Error generating download link:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// ... existing code ...

// ===== NEHTW STOCK DOWNLOAD ROUTES =====

/**
 * Get supported stock sites
 */
app.get('/api/stock/sites', async (req: Request, res: Response) => {
  try {
    const result = await nehtwService.getStockSites();
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching stock sites:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Get stock information
 * POST /api/stock/info
 * Body: { site: string, id: string, url?: string }
 */
app.post('/api/stock/info', async (req: Request, res: Response) => {
  try {
    const { site, id, url } = req.body;
    
    if (!site && !url) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either site+id or full url is required' 
      });
    }
    
    const result = await nehtwService.getStockInfo(site, id, url);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching stock info:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Create stock order
 * POST /api/stock/order
 * Body: { site: string, id: string, url?: string }
 */
app.post('/api/stock/order', async (req: Request, res: Response) => {
  try {
    const { site, id, url } = req.body;
    
    if (!site && !url) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either site+id or full url is required' 
      });
    }
    
    // TODO: Check user balance before creating order
    // TODO: Deduct credits from user account
    
    const result = await nehtwService.createOrder(site, id, url);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // TODO: Save order to database
    // await prisma.order.create({ ... });
    
    res.json(result);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Check order status
 * GET /api/stock/status/:taskId
 */
app.get('/api/stock/status/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const result = await nehtwService.checkOrderStatus(taskId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error checking order status:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Generate download link
 * GET /api/stock/download/:taskId
 */
app.get('/api/stock/download/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const result = await nehtwService.generateDownloadLink(taskId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // TODO: Update order status in database
    // TODO: Log download in transaction history
    
    res.json(result);
  } catch (error) {
    console.error('Error generating download link:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Complete download workflow (create order + poll + download)
 * POST /api/stock/download-workflow
 * Body: { site: string, id: string, url?: string }
 */
app.post('/api/stock/download-workflow', async (req: Request, res: Response) => {
  try {
    const { site, id, url } = req.body;
    
    if (!site && !url) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either site+id or full url is required' 
      });
    }
    
    const result = await nehtwService.downloadStockWorkflow(site, id, url);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in download workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Get account balance
 * GET /api/account/balance
 */
app.get('/api/account/balance', async (req: Request, res: Response) => {
  try {
    const result = await nehtwService.getAccountBalance();
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching account balance:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});
