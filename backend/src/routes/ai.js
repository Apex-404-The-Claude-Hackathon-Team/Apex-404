const router  = require('express').Router();
const rateLimit = require('express-rate-limit');
const { protect, authorize } = require('../middleware/auth');
const {
  getSummary,
  clusterReports,
  getTrends,
  getMPBriefing,
} = require('../controllers/aiController');

// Strict rate limits — every call hits the Anthropic API
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many AI requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const briefingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Too many briefing requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/ai/summarize/:postId  — public; result cached on the Post document
router.get('/summarize/:postId', aiLimiter, getSummary);

// GET /api/ai/cluster/:constituency?limit=30  — public
router.get('/cluster/:constituency', aiLimiter, clusterReports);

// GET /api/ai/trends/:constituency  — public
router.get('/trends/:constituency', aiLimiter, getTrends);

// GET /api/ai/briefing/:constituency  — mp / admin / super_admin only
router.get(
  '/briefing/:constituency',
  briefingLimiter,
  protect,
  authorize('mp', 'admin', 'super_admin'),
  getMPBriefing,
);

module.exports = router;
