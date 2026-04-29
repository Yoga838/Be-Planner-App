// src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Semua routes butuh authentication
router.use(auth);

// Register/Update FCM token
router.post('/register-token', notificationController.registerToken);

// Send test notification
router.post('/test', notificationController.sendTestNotification);

// Send bulk notification (admin feature)
router.post('/bulk', notificationController.sendBulkNotification);

// Get notification history
router.get('/history', notificationController.getNotificationHistory);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

module.exports = router;