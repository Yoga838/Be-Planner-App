// src/controllers/questController.js
const { QuestModel, UserStatsModel } = require('../models');
const socketService = require('../services/socketService');

// Get all quests for a user
exports.getQuests = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    
    const quests = await QuestModel.findAll(req.user.id, filters);
    
    res.json({
      success: true,
      count: quests.length,
      data: quests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create new quest
exports.createQuest = async (req, res) => {
  try {
    const quest = await QuestModel.create(req.user.id, req.body);

    // Notify desktop clients about new quest
    socketService.broadcastToAll('new-quest', quest);

    res.status(201).json({
      success: true,
      data: quest,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Update quest status
exports.updateQuestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const quest = await QuestModel.updateStatus(id, req.user.id, status);

    if (!quest) {
      return res.status(404).json({
        success: false,
        error: 'Quest not found',
      });
    }

    // Handle XP reward on completion
    if (status === 'completed') {
      await UserStatsModel.addXP(req.user.id, quest.xp_reward);
    }

    // Notify connected clients
    socketService.sendToUser(req.user.id, 'quest-status-updated', quest);

    res.json({
      success: true,
      data: quest,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getQuestById = async (req, res) => {
  try {
    const quest = await QuestModel.findById(req.params.id, req.user.id);
    
    if (!quest) {
      return res.status(404).json({
        success: false,
        error: 'Quest not found',
      });
    }

    res.json({
      success: true,
      data: quest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};