// src/services/fcmService.js
let admin;
try {
  admin = require('../config/firebase');
} catch (error) {
  console.warn('⚠️  Firebase not available:', error.message);
  admin = null;
}

class FCMService {
  constructor() {
    this.isInitialized = admin !== null;
    if (this.isInitialized) {
      console.log('📱 FCM Service ready');
    } else {
      console.log('⚠️  FCM Service running in mock mode (notifications disabled)');
    }
  }

  /**
   * Send push notification to single device
   */
  async sendPushNotification(userToken, title, body, data = {}) {
    if (!this.isInitialized) {
      console.log('📱 [MOCK] Push notification:', { title, body });
      return { mock: true, title, body };
    }

    if (!userToken) {
      console.warn('⚠️  No FCM token provided');
      return null;
    }

    try {
      const message = {
        notification: {
          title: title.substring(0, 100), // FCM limit
          body: body.substring(0, 500),   // FCM limit
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          timestamp: Date.now().toString(),
        },
        token: userToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'quest_reminders',
            icon: 'notification_icon',
            color: '#4CAF50',
            priority: 'max',
            visibility: 'public',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
              mutableContent: true,
            },
          },
        },
        webpush: {
          notification: {
            icon: '/icon.png',
            badge: '/badge.png',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Push sent: ${title}`);
      return response;
    } catch (error) {
      console.error('❌ Push notification failed:', error.message);
      
      // Handle specific errors
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        console.warn('   Invalid/expired FCM token - should be removed from database');
        // TODO: Remove token from database
      }
      
      return null;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendMulticastNotification(userTokens, title, body, data = {}) {
    if (!this.isInitialized) {
      console.log(`📱 [MOCK] Multicast to ${userTokens.length} devices`);
      return { mock: true, count: userTokens.length };
    }

    if (!userTokens || userTokens.length === 0) {
      return null;
    }

    // FCM limit: 500 tokens per multicast
    const chunks = this.chunkArray(userTokens, 500);
    const results = [];

    for (const chunk of chunks) {
      try {
        const message = {
          notification: { title, body },
          data: {
            ...data,
            timestamp: Date.now().toString(),
          },
          tokens: chunk,
          android: {
            priority: 'high',
            notification: {
              channelId: 'quest_reminders',
              sound: 'default',
            },
          },
        };

        const response = await admin.messaging().sendMulticast(message);
        results.push(response);
        console.log(`✅ Multicast: ${response.successCount}/${chunk.length} sent`);
        
        // Handle failed tokens
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.warn(`   Token ${chunk[idx].substring(0, 20)}... failed: ${resp.error.message}`);
            }
          });
        }
      } catch (error) {
        console.error('❌ Multicast failed:', error.message);
      }
    }

    return results;
  }

  /**
   * Send notification to topic (all users subscribed)
   */
  async sendToTopic(topic, title, body, data = {}) {
    if (!this.isInitialized) {
      console.log(`📱 [MOCK] Topic notification to: ${topic}`);
      return { mock: true, topic };
    }

    try {
      const message = {
        notification: { title, body },
        data: {
          ...data,
          timestamp: Date.now().toString(),
        },
        topic: topic,
        android: {
          priority: 'high',
          notification: {
            channelId: 'quest_reminders',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Topic notification sent to: ${topic}`);
      return response;
    } catch (error) {
      console.error('❌ Topic notification failed:', error.message);
      return null;
    }
  }

  /**
   * Send quest reminder notification
   */
  async sendQuestReminder(userToken, quest) {
    const hoursLeft = this.getHoursLeft(quest.deadline);
    let title, body;

    if (hoursLeft <= 1) {
      title = '⚡ Quest Almost Expired!';
      body = `"${quest.title}" is due in ${Math.round(hoursLeft * 60)} minutes!`;
    } else if (hoursLeft <= 6) {
      title = '⏰ Quest Due Soon';
      body = `"${quest.title}" is due in ${Math.round(hoursLeft)} hours!`;
    } else {
      title = '📅 Quest Reminder';
      body = `Don't forget: "${quest.title}" is due soon!`;
    }

    return this.sendPushNotification(userToken, title, body, {
      type: 'quest_reminder',
      questId: quest.id,
      hoursLeft: hoursLeft.toString(),
    });
  }

  /**
   * Send nagging notification
   */
  async sendNaggingNotification(userToken, pendingQuests) {
    const messages = [
      `⚔️ Hero! ${pendingQuests.length} quests are waiting for you!`,
      `🛡️ Time to grind! ${pendingQuests.length} quests need your attention!`,
      `⚡ Don't forget your quests! ${pendingQuests.length} remaining!`,
      `🎮 Quest log filling up! ${pendingQuests.length} quests to complete!`,
      `💪 Your quests won't complete themselves! Let's go!`,
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    return this.sendPushNotification(userToken, 'Pixel Task Quest', randomMessage, {
      type: 'nagging',
      pendingCount: pendingQuests.length.toString(),
    });
  }

  /**
   * Send level up notification
   */
  async sendLevelUpNotification(userToken, newLevel, xpGained) {
    const title = '🎉 Level Up!';
    const body = `Congratulations! You've reached Level ${newLevel}! (${xpGained} XP gained)`;

    return this.sendPushNotification(userToken, title, body, {
      type: 'level_up',
      level: newLevel.toString(),
      xp: xpGained.toString(),
    });
  }

  /**
   * Send streak notification
   */
  async sendStreakNotification(userToken, streak) {
    const title = '🔥 Streak Active!';
    const body = `${streak} day streak! Keep it up, hero!`;

    return this.sendPushNotification(userToken, title, body, {
      type: 'streak',
      streak: streak.toString(),
    });
  }

  /**
   * Schedule notification (perlu Firebase Scheduler - Cloud Functions)
   */
  async scheduleNotification(userToken, title, body, scheduledTime, data = {}) {
    // Note: Ini butuh Firebase Cloud Functions untuk scheduling
    // Untuk sekarang, kita simpan ke database dan cron job yang handle
    console.log(`📅 Scheduling notification for: ${scheduledTime}`);
    
    try {
      const { supabaseAdmin } = require('../config/supabase');
      const { error } = await supabaseAdmin
        .from('scheduled_notifications')
        .insert({
          user_token: userToken,
          title,
          body,
          scheduled_time: scheduledTime,
          data,
          sent: false,
        });

      if (error) throw error;
      console.log('✅ Notification scheduled');
    } catch (error) {
      console.error('Failed to schedule notification:', error.message);
    }
  }

  // Helper functions
  getHoursLeft(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return (deadlineDate - now) / (1000 * 60 * 60);
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

module.exports = new FCMService();