/**
 * Express Application Configuration.
 * 
 * Configures middleware, route mounting, health checks, and global error handling.
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

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

// Enable Cross-Origin Resource Sharing for all origins (web frontend, mobile, preview iframe)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email'],
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

// HTML Landing Page for status preview in browser or Render test
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
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #0f172a;
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 1.5rem;
          box-sizing: border-box;
        }
        .card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 1rem;
          padding: 2.5rem;
          max-width: 580px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
        }
        .badge-success { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; }
        .badge-warning { background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid #eab308; }
        h1 { margin: 0 0 0.5rem 0; font-size: 1.75rem; color: #f8fafc; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
        .endpoints {
          text-align: left;
          background: #0f172a;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1.5rem;
          font-family: monospace;
          font-size: 0.85rem;
          color: #38bdf8;
        }
        a { color: #38bdf8; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge ${isDbConnected ? 'badge-success' : 'badge-warning'}">
          Database: ${isDbConnected ? 'Connected' : 'Disconnected / Standby'}
        </span>
        <h1>Rakib Silk & Fashion API</h1>
        <p>Production backend service running for Tally Khata Web & Mobile platforms.</p>
        <p>Health Check: <a href="/health">/health</a></p>
        <div class="endpoints">
          <div>GET  /health</div>
          <div>POST /v1/auth/register</div>
          <div>POST /v1/auth/login</div>
          <div>GET  /v1/inventory</div>
          <div>GET  /v1/production</div>
          <div>GET  /v1/transactions</div>
          <div>POST /v1/upload</div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API Routes Mounting
app.use('/v1/auth', authRoutes);
app.use('/v1/inventory', inventoryRoutes);
app.use('/v1/production', productionRoutes);
app.use('/v1/transactions', transactionRoutes);
app.use('/v1/customers', customerRoutes);
app.use('/v1', uploadRoutes);

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
