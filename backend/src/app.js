/**
 * Express Application Configuration.
 * 
 * Configures middleware, route mounting, health checks, and global error handling.
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const { extractTenantEmail } = require('./middleware/authHeader');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const productionRoutes = require('./routes/productionRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const customerRoutes = require('./routes/customerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Configured Cross-Origin Resource Sharing for verified web origins, mobile clients, and render deployments
const allowedOrigins = [
  'https://rakib-silk-web-front.onrender.com',
  'https://rakib-fashion-backend.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
];
if (process.env.CLIENT_ORIGIN) {
  allowedOrigins.push(process.env.CLIENT_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by CORS origin validation'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email'],
  credentials: true,
}));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Multi-tenant email header extractor
app.use(extractTenantEmail);

// Health check endpoint for monitoring, Docker healthchecks, and Render uptime pingers
app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// API Routes Mounting
app.use('/v1/auth', authRoutes);
app.use('/v1/inventory', inventoryRoutes);
app.use('/v1/production', productionRoutes);
app.use('/v1/transactions', transactionRoutes);
app.use('/v1/customers', customerRoutes);
app.use('/v1', uploadRoutes);

// Static Frontend Delivery & SPA Client Routing
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    // If request begins with /v1, let it pass to 404 handler
    if (req.originalUrl.startsWith('/v1')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Fallback: If frontend has not been compiled yet, display API status page
  app.get('/', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rakib Silk & Fashion API</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 1rem; padding: 2.5rem; text-align: center; max-width: 500px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Rakib Silk & Fashion API</h2>
          <p>Database: ${isDbConnected ? 'Connected' : 'Disconnected'}</p>
          <p><a href="/health" style="color: #38bdf8;">/health</a></p>
        </div>
      </body>
      </html>
    `);
  });
}

// 404 Route Not Found Handler (for unmatched API endpoints)
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
