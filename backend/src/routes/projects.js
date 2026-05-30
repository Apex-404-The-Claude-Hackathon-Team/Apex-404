const router = require('express').Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { uploadImages } = require('../middleware/upload');
const {
  createProject, getProjects, getProject,
  updateProject, updateStatus, addUpdate, deleteProject,
} = require('../controllers/projectController');

const CATEGORIES = [
  'roads_transport', 'water_sanitation', 'electricity', 'healthcare',
  'education', 'security', 'flooding', 'waste_management',
  'public_infrastructure', 'other',
];

const STATUSES = ['budgeted', 'in_progress', 'completed', 'delayed', 'budget_heavy', 'under_review'];

const projectRules = [
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required.').isLength({ max: 5000 }),
  body('category').optional().isIn(CATEGORIES),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number.'),
  body('startDate').optional().isISO8601().withMessage('startDate must be a valid date.'),
  body('expectedEndDate').optional().isISO8601().withMessage('expectedEndDate must be a valid date.'),
];

const statusRules = [
  body('status').isIn(STATUSES).withMessage('Invalid status value.'),
];

const updateRules = [
  body('body').trim().notEmpty().withMessage('Update body is required.').isLength({ max: 2000 }),
];

// Wrap multer so its errors surface as JSON
const handleUpload = (middleware) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (!err) return next();
    const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
    res.status(status).json({ message: err.message });
  });
};

const mpOrAdmin = authorize('mp', 'admin', 'super_admin');

// ── public ────────────────────────────────────────────────────────────────────
router.get('/',    getProjects);
router.get('/:id', getProject);

// ── mp / admin ────────────────────────────────────────────────────────────────
router.post('/',
  protect,
  mpOrAdmin,
  handleUpload(uploadImages),
  projectRules,
  createProject
);

router.patch('/:id',
  protect,
  mpOrAdmin,
  projectRules,
  updateProject
);

router.patch('/:id/status',
  protect,
  mpOrAdmin,
  statusRules,
  updateStatus
);

router.post('/:id/updates',
  protect,
  mpOrAdmin,
  handleUpload(uploadImages),
  updateRules,
  addUpdate
);

router.delete('/:id',
  protect,
  authorize('admin', 'super_admin'),
  deleteProject
);

module.exports = router;
