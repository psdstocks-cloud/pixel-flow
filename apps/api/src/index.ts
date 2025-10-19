// --- Simplified Server for Railway Health Check Diagnosis ---

import * as http from 'http';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const server = http.createServer((req, res) => {
  // Always respond to the health check successfully
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    console.log(`[${new Date().toISOString()}] Responded to /health check.`);
    return;
  }

  // Default response for any other request
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.on('error', (error: any) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Simplified API server listening on 0.0.0.0:${port}`);
  console.log(`🩺 Health check endpoint is active at http://localhost:${port}/health`);
});

console.log('🚀 Simplified API server script is running...');