// api/cron/nagging.js
const cronService = require('../../src/services/cronService');

module.exports = async (req, res) => {
  try {
    await cronService.sendNaggingNotifications();
    res.json({ success: true, message: 'Nagging notifications sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};