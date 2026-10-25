/**
 * Application Entrypoint.
 * 
 * Initializes environment variables, establishes the MongoDB Atlas connection,
 * and starts the HTTP server listening on the configured port.
 */

require('dotenv').config();

const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  // Connect to MongoDB Atlas
  await connectDB();

  // Start HTTP Server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Rakib Silk & Fashion API server listening on http://0.0.0.0:${PORT}`);
    console.log(`🩺 Health check available at: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown handling
  const handleExit = (signal) => {
    console.log(`\n🛑 Received ${signal}. Gracefully terminating server...`);
    server.close(() => {
      console.log('💤 HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleExit('SIGINT'));
  process.on('SIGTERM', () => handleExit('SIGTERM'));
}

bootstrap();
