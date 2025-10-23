import express from 'express';
import cors from 'cors';
import ordersRouter from './routes/orders';
import packagesRouter from './routes/packages'; // Add this import

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Pixel Flow API running' });
});

// Routes
app.use('/api/orders', ordersRouter);
app.use('/api/packages', packagesRouter); // Add this line

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`✅ API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`💳 Packages API: http://localhost:${PORT}/api/packages`);
});
