const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post    = require('../models/Post');

exports.addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { postId } = req.params;
  const { body, parentComment } = req.body;

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: 'Report not found.' });

  // Validate parent comment belongs to the same post
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent || parent.post.toString() !== postId || parent.isDeleted)
      return res.status(400).json({ message: 'Invalid parent comment.' });
  }

  const comment = await Comment.create({
    post:          postId,
    author:        req.user.id,
    body,
    parentComment: parentComment ?? null,
  });

  await comment.populate('author', 'firstName lastName');
  res.status(201).json({ comment });
};

exports.getComments = async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: 'Report not found.' });

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = { post: postId };

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'firstName lastName'),
    Comment.countDocuments(filter),
  ]);

  // Mask deleted comment bodies but keep the node for thread structure
  const sanitized = comments.map((c) => {
    if (!c.isDeleted) return c;
    return {
      _id:           c._id,
      post:          c.post,
      parentComment: c.parentComment,
      isDeleted:     true,
      body:          '[deleted]',
      author:        null,
      createdAt:     c.createdAt,
      updatedAt:     c.updatedAt,
    };
  });

  res.json({ comments: sanitized, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

exports.updateComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted)
    return res.status(404).json({ message: 'Comment not found.' });

  if (comment.author.toString() !== req.user.id)
    return res.status(403).json({ message: 'Forbidden.' });

  comment.body = req.body.body;
  await comment.save();
  await comment.populate('author', 'firstName lastName');
  res.json({ comment });
};

exports.deleteComment = async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted)
    return res.status(404).json({ message: 'Comment not found.' });

  const isOwner      = comment.author.toString() === req.user.id;
  const isPrivileged = ['admin', 'super_admin', 'moderator'].includes(req.user.role);
  if (!isOwner && !isPrivileged)
    return res.status(403).json({ message: 'Forbidden.' });

  comment.isDeleted = true;
  comment.body = '';
  await comment.save();
  res.json({ message: 'Comment deleted.' });
};
