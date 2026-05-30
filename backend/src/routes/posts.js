const router = require('express').Router();
const { body, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { uploadMedia } = require('../middleware/upload');
const {
  createPost, getPosts, getPost,
  updatePost, updateStatus, deletePost, toggleUpvote, toggleDownvote,
} = require('../controllers/postController');
const commentRouter = require('./comments');

const postRules = [
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 150 }),
  body('description').trim().notEmpty().withMessage('Description is required.').isLength({ max: 5000 }),
  body('category')
    .optional()
    .isIn([
      'roads_transport', 'water_sanitation', 'electricity', 'healthcare',
      'education', 'corruption', 'security', 'flooding',
      'waste_management', 'public_infrastructure', 'other',
    ]),
];

const statusRules = [
  body('status').isIn(['pending', 'under_review', 'resolved', 'rejected', 'ignored']),
];

// Multer errors are not caught by the global handler automatically
const handleUpload = (middleware) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (!err) return next();
    const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
    res.status(status).json({ message: err.message });
  });
};

router.get('/',     getPosts);
router.get('/:id',  getPost);

router.post('/',
  protect,
  handleUpload(uploadMedia),
  postRules,
  createPost
);

router.patch('/:id',
  protect,
  updatePost
);

router.patch('/:id/status',
  protect,
  authorize('admin', 'super_admin', 'moderator'),
  statusRules,
  updateStatus
);

router.delete('/:id',
  protect,
  deletePost
);

router.post('/:id/upvote',
  protect,
  toggleUpvote
);

router.post('/:id/downvote',
  protect,
  toggleDownvote
);

// Nested comment routes — /api/posts/:postId/comments[/:id]
router.use('/:postId/comments', commentRouter);

module.exports = router;
