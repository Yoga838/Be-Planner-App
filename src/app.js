// src/app.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import socket dengan destructuring yang benar
const { initializeSocket } = require('./config/socket');
const cronService = require('./services/cronService');

// Import routes
const questRoutes = require('./routes/questRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);  // Sekarang ini function yang valid

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Supabase',
    version: '2.0.0'
  });
});

app.use('/api/v1/quests', questRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/quests', questRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes)
app.get('/',(req,res) => {
  res.json({
    Status : "success"
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start cron jobs
cronService.startNaggingCron();
cronService.startDeadlineCheckCron();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`⚔️ Pixel Task Quest server running on port ${PORT}`);
  console.log(`🗄️ Database: Supabase (PostgreSQL)`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔔 Nagging: ${process.env.FREE_DAYS} between ${process.env.NAGGING_START_HOUR}:00-${process.env.NAGGING_END_HOUR}:00`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };