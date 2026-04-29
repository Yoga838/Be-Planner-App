// src/controllers/notificationController.js
const fcmService = require('../services/fcmService');
const { UserModel, QuestModel } = require('../models');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Register/Update FCM Token
 */
exports.registerToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'FCM token is required',
      });
    }

    // Update token di profiles
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        fcm_token: token,
        device_platform: platform || 'mobile',
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    // Subscribe ke topic global
    try {
      await fcmService.sendToTopic('all_users', 'Welcome!', 'You are now connected!');
    } catch (err) {
      console.warn('Topic subscription notice:', err.message);
    }

    res.json({
      success: true,
      message: 'FCM token registered successfully',
      data: {
        platform: data.device_platform,
        token_registered: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Send Test Notification
 */
exports.sendTestNotification = async (req, res) => {
  try {
    // Ambil token user
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('fcm_token')
      .eq('id', req.user.id)
      .single();

    if (!profile || !profile.fcm_token) {
      return res.status(400).json({
        success: false,
        error: 'No FCM token registered. Please register token first.',
      });
    }

    const result = await fcmService.sendPushNotification(
      profile.fcm_token,
      '🧪 Test Notification',
      'This is a test notification from Pixel Task Quest!',
      { type: 'test', timestamp: Date.now().toString() }
    );

    res.json({
      success: true,
      message: 'Test notification sent',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Send Bulk Notification (Admin only)
 */
exports.sendBulkNotification = async (req, res) => {
  try {
    const { title, body, userIds } = req.body;

    let tokens;
    if (userIds && userIds.length > 0) {
      // Get tokens for specific users
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('fcm_token')
        .in('id', userIds)
        .not('fcm_token', 'is', null);

      tokens = profiles.map(p => p.fcm_token);
    } else {
      // Get all tokens
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('fcm_token')
        .not('fcm_token', 'is', null);

      tokens = profiles.map(p => p.fcm_token);
    }

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid FCM tokens found',
      });
    }

    const result = await fcmService.sendMulticastNotification(
      tokens,
      title,
      body,
      { type: 'broadcast' }
    );

    res.json({
      success: true,
      message: `Notification sent to ${tokens.length} devices`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get Notification History
 */
exports.getNotificationHistory = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Mark Notification as Read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('notification_logs')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};