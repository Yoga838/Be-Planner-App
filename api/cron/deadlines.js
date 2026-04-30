// api/cron/deadlines.js
const cronService = require('../../src/services/cronService');

module.exports = async (req, res) => {
  try {
    await cronService.checkUpcomingDeadlines();
    res.json({ success: true, message: 'Deadline check completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};