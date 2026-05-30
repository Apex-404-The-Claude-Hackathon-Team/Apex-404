const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { protect, authorize } = require('../middleware/auth');
const {
  submitVerification,
  getMyVerification,
  listVerifications,
  reviewVerification,
} = require('../controllers/verificationController');

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/verification  — submit voter ID
router.post('/', protect, submitLimiter, submitVerification);

// GET /api/verification/me  — own status (must be before /:id)
router.get('/me', protect, getMyVerification);

// Admin routes
router.get('/',    protect, authorize('admin', 'super_admin'), listVerifications);
router.patch('/:id', protect, authorize('admin', 'super_admin'), reviewVerification);

module.exports = router;
