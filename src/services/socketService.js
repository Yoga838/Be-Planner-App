// src/services/socketService.js
const { getIO } = require('../config/socket');

class SocketService {
  /**
   * Send event to specific user
   */
  sendToUser(userId, event, data) {
    try {
      const io = getIO();
      if (!io) {
        console.warn('Socket.io not initialized, skipping notification');
        return;
      }
      io.to(`user-${userId}`).emit(event, data);
      console.log(`📤 Socket event sent to user ${userId}: ${event}`);
    } catch (error) {
      console.error('Socket emission error:', error.message);
    }
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcastToAll(event, data) {
    try {
      const io = getIO();
      if (!io) {
        console.warn('Socket.io not initialized, skipping broadcast');
        return;
      }
      io.emit(event, data);
      console.log(`📢 Broadcast event: ${event}`);
    } catch (error) {
      console.error('Socket broadcast error:', error.message);
    }
  }

  /**
   * Send quest reminder notification
   */
  sendQuestReminder(userId, quest) {
    this.sendToUser(userId, 'quest-reminder', {
      type: 'QUEST_DEADLINE_REMINDER',
      quest: {
        id: quest.id,
        title: quest.title,
        deadline: quest.deadline,
        status: quest.status,
      },
      message: `Quest "${quest.title}" is due soon!`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send nagging notification
   */
  sendNaggingNotification(userId, pendingQuests) {
    this.sendToUser(userId, 'nagging-notification', {
      type: 'NAGGING_REMINDER',
      pendingQuests: pendingQuests.map(q => ({
        id: q.id,
        title: q.title,
        deadline: q.deadline
      })),
      message: `You have ${pendingQuests.length} pending quests! Time to grind! ⚔️`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify about XP gain
   */
  sendXPGained(userId, xpAmount, newLevel) {
    this.sendToUser(userId, 'xp-gained', {
      type: 'XP_GAINED',
      xp: xpAmount,
      newLevel: newLevel,
      message: `Gained ${xpAmount} XP!`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify about level up
   */
  sendLevelUp(userId, newLevel, totalXP) {
    this.sendToUser(userId, 'level-up', {
      type: 'LEVEL_UP',
      level: newLevel,
      xp: totalXP,
      message: `🎉 Level Up! You are now level ${newLevel}!`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify quest status change
   */
  sendQuestStatusChanged(userId, quest) {
    this.sendToUser(userId, 'quest-status-changed', {
      type: 'QUEST_STATUS_CHANGED',
      quest: {
        id: quest.id,
        title: quest.title,
        status: quest.status,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

// Export instance, bukan class
const socketService = new SocketService();
module.exports = socketService;