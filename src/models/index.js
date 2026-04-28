// src/models/index.js
const { supabaseAdmin } = require('../config/supabase');

// Quest Operations
const QuestModel = {
  async findAll(userId, filters = {}) {
    let query = supabaseAdmin
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .order('deadline', { ascending: true });
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async findById(questId, userId) {
    const { data, error } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(userId, questData) {
    const { data, error } = await supabaseAdmin
      .from('quests')
      .insert({
        user_id: userId,
        title: questData.title,
        description: questData.description || '',
        priority: questData.priority || 'medium',
        deadline: questData.deadline,
        xp_reward: questData.xpReward || 100,
        tags: questData.tags || [],
        status: 'active'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateStatus(questId, userId, status) {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { data, error } = await supabaseAdmin
      .from('quests')
      .update(updateData)
      .eq('id', questId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async findPendingByUser(userId, limit = 5) {
    const { data, error } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('deadline', new Date().toISOString())
      .order('deadline', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async findDeadlineApproaching(userId, hoursThreshold = 3) {
    const now = new Date();
    const threshold = new Date(now.getTime() + hoursThreshold * 60 * 60 * 1000);
    
    const { data, error } = await supabaseAdmin
      .from('quests')
      .select('*, profiles!inner(*)')
      .eq('status', 'active')
      .gte('deadline', now.toISOString())
      .lte('deadline', threshold.toISOString());
    
    if (error) throw error;
    return data;
  }
};

// User Operations
const UserModel = {
  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data;
  },

  async findById(userId) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateFCMToken(userId, token) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        fcm_token: token,
        device_platform: 'mobile'
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePreferences(userId, preferences) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        notification_preferences: preferences,
        free_days: preferences.freeDays
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUsersWithNagging(freeDay, startHour, endHour) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .contains('free_days', [freeDay])
      .filter('notification_preferences->naggingEnabled', 'eq', true);
    
    if (error) throw error;
    return data;
  }
};

// UserStats Operations
const UserStatsModel = {
  async findByUserId(userId) {
    const { data, error } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async addXP(userId, xpAmount) {
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('xp, level')
      .eq('user_id', userId)
      .single();
    
    const newXP = stats.xp + xpAmount;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
    
    const { data, error } = await supabaseAdmin
      .from('user_stats')
      .update({ 
        xp: newXP,
        level: newLevel,
        total_xp_earned: stats.total_xp_earned + xpAmount
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, leveledUp: newLevel > stats.level };
  }
};

// Inventory Operations
const InventoryModel = {
  async getItems(userId) {
    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .order('acquired_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async addItem(userId, itemData) {
    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .upsert({
        user_id: userId,
        item_id: itemData.itemId,
        name: itemData.name,
        type: itemData.type || 'consumable',
        quantity: itemData.quantity || 1,
        metadata: itemData.metadata || {}
      }, {
        onConflict: 'user_id, item_id',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateQuantity(userId, itemId, quantity) {
    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Notification Log Operations
const NotificationLogModel = {
  async create(userId, notificationData) {
    const { data, error } = await supabaseAdmin
      .from('notification_logs')
      .insert({
        user_id: userId,
        type: notificationData.type,
        title: notificationData.title,
        body: notificationData.body,
        quest_id: notificationData.questId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

module.exports = {
  QuestModel,
  UserModel,
  UserStatsModel,
  InventoryModel,
  NotificationLogModel
};