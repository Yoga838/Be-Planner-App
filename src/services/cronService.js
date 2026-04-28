// src/services/cronService.js
const cron = require('node-cron');
const { UserModel, QuestModel, NotificationLogModel } = require('../models');
const fcmService = require('./fcmService');
const socketService = require('./socketService');

class CronService {
  constructor() {
    this.freeDays = (process.env.FREE_DAYS || 'Saturday,Sunday').split(',');
    this.startHour = parseInt(process.env.NAGGING_START_HOUR) || 20;
    this.endHour = parseInt(process.env.NAGGING_END_HOUR) || 1;
  }

  startNaggingCron() {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
      await this.sendNaggingNotifications();
    });

    console.log('🔔 Nagging cron job initialized');
  }

  async sendNaggingNotifications() {
    const now = new Date();
    const currentDay = now.toLocaleString('en-US', { weekday: 'long' });
    const currentHour = now.getHours();

    if (!this.freeDays.includes(currentDay)) {
      console.log(`Not a free day (${currentDay}). Skipping.`);
      return;
    }

    if (!this.isInNaggingWindow(currentHour)) {
      console.log(`Hour ${currentHour} outside nagging window. Skipping.`);
      return;
    }

    console.log(`📢 Sending nagging notifications for ${currentDay} at ${currentHour}:00`);

    try {
      const users = await UserModel.getUsersWithNagging(
        currentDay,
        this.startHour,
        this.endHour
      );

      for (const user of users) {
        const pendingQuests = await QuestModel.findPendingByUser(user.id, 5);

        if (pendingQuests.length === 0) continue;

        const naggingMessages = [
          `⚔️ Hero! ${pendingQuests.length} quests waiting!`,
          `🛡️ Time to grind! ${pendingQuests.length} quests need you!`,
          `⚡ Pssst... ${pendingQuests.length} quests collecting dust!`,
          `🎮 Quest alert! ${pendingQuests.length} unfinished quests!`,
        ];

        const randomMessage = naggingMessages[Math.floor(Math.random() * naggingMessages.length)];

        // Mobile push notification
        if (user.fcm_token && user.notification_preferences?.pushEnabled) {
          await fcmService.sendPushNotification(
            user.fcm_token,
            'Quest Reminder! ⚔️',
            randomMessage,
            {
              type: 'nagging',
              pendingCount: pendingQuests.length.toString(),
              quests: JSON.stringify(pendingQuests.map(q => q.title))
            }
          );
        }

        // Desktop socket notification
        if (user.notification_preferences?.socketEnabled) {
          socketService.sendNaggingNotification(user.id, pendingQuests);
        }

        // Log notification
        await NotificationLogModel.create(user.id, {
          type: 'nagging',
          title: 'Quest Reminder! ⚔️',
          body: randomMessage
        });
      }
    } catch (error) {
      console.error('Error in nagging cron:', error);
    }
  }

  isInNaggingWindow(hour) {
    if (this.startHour < this.endHour) {
      return hour >= this.startHour && hour < this.endHour;
    } else {
      return hour >= this.startHour || hour < this.endHour;
    }
  }

  startDeadlineCheckCron() {
    cron.schedule('*/30 * * * *', async () => {
      await this.checkUpcomingDeadlines();
    });
  }

  async checkUpcomingDeadlines() {
    const now = new Date();
    const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const threeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    try {
      const questsDueSoon = await QuestModel.findDeadlineApproaching(null, 3);

      for (const quest of questsDueSoon) {
        const user = quest.profiles;
        
        if (!user) continue;

        const isUrgent = new Date(quest.deadline) <= oneHour;
        
        if (isUrgent) {
          if (user.fcm_token) {
            await fcmService.sendPushNotification(
              user.fcm_token,
              '⚡ Quest Almost Expired!',
              `"${quest.title}" due in less than an hour!`,
              { type: 'urgent_deadline', questId: quest.id }
            );
          }
          
          socketService.sendToUser(user.id, 'urgent-quest-reminder', quest);
        } else {
          if (user.fcm_token) {
            await fcmService.sendPushNotification(
              user.fcm_token,
              '📅 Quest Deadline Approaching',
              `"${quest.title}" due soon!`,
              { type: 'deadline_reminder', questId: quest.id }
            );
          }
        }

        // Log notification
        await NotificationLogModel.create(user.id, {
          type: 'deadline',
          title: isUrgent ? 'Quest Almost Expired!' : 'Deadline Approaching',
          body: `"${quest.title}" is due ${isUrgent ? 'in less than an hour' : 'soon'}!`,
          questId: quest.id
        });
      }
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  }
}

module.exports = new CronService();