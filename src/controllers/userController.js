// src/controllers/userController.js
const { UserModel, UserStatsModel, InventoryModel } = require('../models');
const { supabaseAdmin } = require('../config/supabase');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (authError) throw authError;

    res.status(201).json({
      success: true,
      data: {
        user: authData.user,
        session: authData.session
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await UserStatsModel.findByUserId(req.user.id);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updateFCMToken = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await UserModel.updateFCMToken(req.user.id, token);
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const preferences = req.body;
    const user = await UserModel.updatePreferences(req.user.id, preferences);
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const items = await InventoryModel.getItems(req.user.id);
    
    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};