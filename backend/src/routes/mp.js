const router = require('express').Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const { listMPs, getMPByConstituency, getMyProfile, upsertProfile, uploadPhoto, verifyMP } = require('../controllers/mpController');

const profileRules = [
  body('constituency').optional().trim().notEmpty().withMessage('Constituency cannot be blank.'),
  body('party').optional().trim().isLength({ max: 100 }),
  body('bio').optional().trim().isLength({ max: 1000 }),
  body('contactEmail').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('contactPhone').optional().trim().isLength({ max: 30 }),
  body('termStart').optional({ checkFalsy: true }).isISO8601().withMessage('termStart must be a valid date.'),
  body('termEnd').optional({ checkFalsy: true }).isISO8601().withMessage('termEnd must be a valid date.'),
];

// Photo upload — single image, 5 MB max
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Only JPEG, PNG, or WebP images are allowed.'), { status: 415 }), false);
  },
}).single('photo');

const handleUpload = (req, res, next) => {
  photoUpload(req, res, (err) => {
    if (!err) return next();
    res.status(err.status || 400).json({ message: err.message });
  });
};

// ── public ────────────────────────────────────────────────────────────────────
router.get('/',                  listMPs);

// IMPORTANT: /profile/me must be declared before /:constituency
// so Express doesn't treat "profile" as a constituency slug.
router.get('/profile/me',        protect, authorize('mp'), getMyProfile);
router.put('/profile',           protect, authorize('mp'), profileRules, upsertProfile);
router.post('/profile/photo',    protect, authorize('mp'), handleUpload, uploadPhoto);

router.get('/:constituency',     getMPByConstituency);

// ── admin ─────────────────────────────────────────────────────────────────────
router.patch('/:userId/verify',  protect, authorize('admin', 'super_admin'), verifyMP);

module.exports = router;
