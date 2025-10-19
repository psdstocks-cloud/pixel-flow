// --- START DIAGNOSTIC LOGGING ---
// These logs will run first, telling us if the process has started.
console.log('🚀 Starting Pixel Flow API server...');
console.log('--- Environment Variables ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('NEHTW_API_KEY:', process.env.NEHTW_API_KEY ? 'SET' : 'NOT SET');
console.log('---------------------------');
// --- END DIAGNOSTIC LOGGING ---

import express from 'express';
import cors from 'cors';

// This will catch any error that happens during the main setup of your app.
try {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

  // CORS Configuration
  const rawOrigins = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'];
  const allowedOrigins = rawOrigins
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, ''));

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }
        console.error(`CORS Error: Origin ${normalizedOrigin} not allowed.`);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  app.use(express.json());

  // Health check for Railway
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Basic API info
  app.get('/api/info', (req, res) => {
    res.json({
      status: 'API running',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        NEHTW_API_KEY: process.env.NEHTW_API_KEY ? 'SET' : 'NOT SET',
      },
    });
  });

  // Start server and listen for errors
  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ API listening on 0.0.0.0:${port}`);
    console.log(`🔍 Health check available at http://0.0.0.0:${port}/health`);
    console.log(`📊 API info available at http://0.0.0.0:${port}/api/info`);
  }).on('error', (error: any) => { // Catches errors during server listening (e.g., port in use)
    console.error('❌ Failed to start server listening:', error);
    process.exit(1);
  });

} catch (error) { // Catches synchronous errors during app initialization
  console.error('💥 A critical error occurred during API startup:', error);
  process.exit(1);
}