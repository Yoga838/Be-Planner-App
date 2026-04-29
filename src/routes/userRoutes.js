// src/routes/userRoutes.js (UPDATED with Swagger docs)
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new hero
 *     description: Create a new account to start your quest journey!
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: hero@pixelquest.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: test123456
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: PixelHero
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     session:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                           description: JWT token for API access
 *       400:
 *         description: Invalid data or email already exists
 */
router.post('/register', userController.register);

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login to your account
 *     description: Get your JWT token to access quest features
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: hero@pixelquest.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: test123456
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                           description: Use this as Bearer token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', userController.login);

// Protected routes
router.use(auth);

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     tags: [User]
 *     summary: Get your RPG stats
 *     description: View your XP, Level, Streak, and quest completion stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User stats retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserStats'
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', userController.getStats);

/**
 * @swagger
 * /api/v1/users/inventory:
 *   get:
 *     tags: [User]
 *     summary: Get your inventory
 *     description: View all items you've collected from quests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryItem'
 */
router.get('/inventory', userController.getInventory);

/**
 * @swagger
 * /api/v1/users/fcm-token:
 *   put:
 *     tags: [User]
 *     summary: Register FCM token for push notifications
 *     description: Register your device token from Firebase Cloud Messaging
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
 *                 description: FCM token from Firebase
 *               platform:
 *                 type: string
 *                 enum: [mobile, desktop, web]
 *                 default: mobile
 *     responses:
 *       200:
 *         description: Token registered
 *       400:
 *         description: Token is required
 */
router.put('/fcm-token', userController.updateFCMToken);

/**
 * @swagger
 * /api/v1/users/preferences:
 *   put:
 *     tags: [User]
 *     summary: Update notification preferences
 *     description: Customize when and how you receive notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pushEnabled:
 *                 type: boolean
 *                 description: Enable push notifications
 *               socketEnabled:
 *                 type: boolean
 *                 description: Enable real-time desktop notifications
 *               naggingEnabled:
 *                 type: boolean
 *                 description: Enable nagging reminders on free days
 *               freeDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Saturday", "Sunday"]
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put('/preferences', userController.updatePreferences);

module.exports = router;