// src/routes/questRoutes.js
const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/')
  .get(questController.getQuests)
  .post(questController.createQuest);

router.route('/:id')
  .get(questController.getQuestById)
  .put(questController.updateQuestStatus);

module.exports = router;