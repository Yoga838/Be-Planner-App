// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/register', userController.register);
router.post('/login', userController.login);

router.use(auth);
router.get('/stats', userController.getStats);
router.get('/inventory', userController.getInventory);
router.put('/fcm-token', userController.updateFCMToken);
router.put('/preferences', userController.updatePreferences);

module.exports = router;