// src/app.js (UPDATED - Add Swagger route)
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import configs
const { initializeSocket } = require('./config/socket');

// Import routes
const questRoutes = require('./routes/questRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const swaggerRoutes = require('./routes/swaggerRoutes'); // TAMBAHKAN INI

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
try {
  initializeSocket(server);
  console.log('✅ Socket.io initialized');
} catch (error) {
  console.warn('⚠️  Socket.io initialization failed:', error.message);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation Route (NO AUTH)
app.use('/api-docs', swaggerRoutes);

// API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Supabase',
    version: '2.0.0',
    docs: 'http://localhost:3000/api-docs'
  });
});

app.use('/api/v1/quests', questRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found. Check API docs at /api-docs',
    docs: 'http://localhost:3000/api-docs'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start cron jobs
try {
  const cronService = require('./services/cronService');
  cronService.startNaggingCron();
  cronService.startDeadlineCheckCron();
  console.log('✅ Cron jobs started');
} catch (error) {
  console.warn('⚠️  Cron service not available:', error.message);
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`\n⚔️  Pixel Task Quest server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🗄️  Database: Supabase (PostgreSQL)`);
  console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = app;