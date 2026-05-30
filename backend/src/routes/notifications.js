const router = require('express').Router();
const Notification = require('../models/Notification');

router.get('/', async (req, res) => {
  try {
    const { constituency, limit = 15 } = req.query;
    const filter = {};
    if (constituency) {
      filter.constituency = constituency;
    }
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
