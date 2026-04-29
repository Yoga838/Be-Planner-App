// src/routes/notificationRoutes.js (UPDATED with Swagger docs)
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/v1/notifications/register-token:
 *   post:
 *     tags: [Notifications]
 *     summary: Register FCM token
 *     description: Register your device for push notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Firebase Cloud Messaging token
 *               platform:
 *                 type: string
 *                 enum: [mobile, desktop, web]
 *     responses:
 *       200:
 *         description: Token registered successfully
 */
router.post('/register-token', notificationController.registerToken);

/**
 * @swagger
 * /api/v1/notifications/test:
 *   post:
 *     tags: [Notifications]
 *     summary: Send test notification
 *     description: Send a test push notification to verify setup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test notification sent
 *       400:
 *         description: No FCM token registered
 */
router.post('/test', notificationController.sendTestNotification);

/**
 * @swagger
 * /api/v1/notifications/history:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification history
 *     description: View your recent notification history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification history
 */
router.get('/history', notificationController.getNotificationHistory);

module.exports = router;