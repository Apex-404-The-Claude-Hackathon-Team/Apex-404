const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  addComment, getComments, updateComment, deleteComment,
} = require('../controllers/commentController');

const bodyRule = body('body').trim().notEmpty().withMessage('Comment body is required.').isLength({ max: 2000 });

// GET  /api/posts/:postId/comments
router.get('/', getComments);

// POST /api/posts/:postId/comments
router.post('/',
  protect,
  bodyRule,
  addComment
);

// PATCH /api/posts/:postId/comments/:id
router.patch('/:id',
  protect,
  bodyRule,
  updateComment
);

// DELETE /api/posts/:postId/comments/:id
router.delete('/:id',
  protect,
  deleteComment
);

module.exports = router;
