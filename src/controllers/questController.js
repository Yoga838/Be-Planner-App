// src/controllers/questController.js
const { QuestModel, UserStatsModel } = require('../models');
const { supabaseAdmin } = require('../config/supabase');
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
    console.error('Error getting quests:', error);
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
    try {
      socketService.broadcastToAll('new-quest', quest);
    } catch (socketError) {
      console.warn('Socket notification failed:', socketError.message);
    }

    res.status(201).json({
      success: true,
      data: quest,
    });
  } catch (error) {
    console.error('Error creating quest:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single quest by ID
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
    console.error('Error getting quest:', error);
    res.status(500).json({
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

    // Validasi status
    const validStatuses = ['active', 'completed', 'failed', 'abandoned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const quest = await QuestModel.updateStatus(id, req.user.id, status);

    if (!quest) {
      return res.status(404).json({
        success: false,
        error: 'Quest not found',
      });
    }

    // Handle XP reward on completion
    if (status === 'completed') {
      try {
        const result = await UserStatsModel.addXP(req.user.id, quest.xp_reward);
        
        // Notify level up if happened
        if (result && result.leveledUp) {
          try {
            socketService.sendLevelUp(req.user.id, result.data.level, result.data.xp);
          } catch (socketError) {
            console.warn('Socket level-up notification failed:', socketError.message);
          }
        }
      } catch (statsError) {
        console.warn('Failed to update stats:', statsError.message);
      }
    }

    // Notify connected clients
    try {
      socketService.sendQuestStatusChanged(req.user.id, quest);
    } catch (socketError) {
      console.warn('Socket notification failed:', socketError.message);
    }

    res.json({
      success: true,
      data: quest,
    });
  } catch (error) {
    console.error('Error updating quest:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete quest
exports.deleteQuest = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek dulu quest exists dan milik user ini
    const quest = await QuestModel.findById(id, req.user.id);
    
    if (!quest) {
      return res.status(404).json({
        success: false,
        error: 'Quest not found or you do not have permission to delete it',
      });
    }

    // Delete quest
    const { error } = await supabaseAdmin
      .from('quests')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    // Delete related notification logs (optional - keep history)
    // await supabaseAdmin.from('notification_logs').delete().eq('quest_id', id);

    // Notify clients about deletion
    try {
      socketService.sendToUser(req.user.id, 'quest-deleted', { 
        id,
        title: quest.title 
      });
    } catch (socketError) {
      console.warn('Socket notification failed:', socketError.message);
    }

    res.json({
      success: true,
      message: 'Quest deleted successfully',
      data: {
        id,
        title: quest.title
      }
    });
  } catch (error) {
    console.error('Error deleting quest:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Bulk delete completed/failed quests
exports.clearCompletedQuests = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('quests')
      .delete()
      .eq('user_id', req.user.id)
      .in('status', ['completed', 'failed', 'abandoned']);

    if (error) throw error;

    res.json({
      success: true,
      message: 'All completed/failed/abandoned quests have been cleared',
    });
  } catch (error) {
    console.error('Error clearing quests:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update quest details (title, description, priority, etc.)
exports.updateQuestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, deadline, xp_reward, tags } = req.body;

    // Build update object
    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority) updates.priority = priority;
    if (deadline) updates.deadline = deadline;
    if (xp_reward) updates.xp_reward = xp_reward;
    if (tags) updates.tags = tags;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('quests')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Quest not found',
      });
    }

    // Notify clients
    try {
      socketService.sendToUser(req.user.id, 'quest-updated', data);
    } catch (socketError) {
      console.warn('Socket notification failed:', socketError.message);
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating quest details:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};