const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { uploadStream, deleteAsset } = require('../config/cloudinary');

// ── helpers ──────────────────────────────────────────────────────────────────

const toMedia = (result, resourceType) => ({
  url:          result.secure_url,
  publicId:     result.public_id,
  resourceType,
  format:       result.format,
  bytes:        result.bytes,
  duration:     result.duration ?? null,
});

const pushToCloudinary = async (files, folder, resourceType) => {
  const list = Array.isArray(files) ? files : [files];
  return Promise.all(
    list.map((f) =>
      uploadStream(f.buffer, { folder, resource_type: resourceType })
        .then((r) => toMedia(r, resourceType))
    )
  );
};

// ── controllers ──────────────────────────────────────────────────────────────

exports.createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { title, description, category, tags, location, constituency } = req.body;

  const imageFiles = req.files?.images ?? [];
  const audioFiles = req.files?.audio  ?? [];

  const [images, audioArr] = await Promise.all([
    imageFiles.length
      ? pushToCloudinary(imageFiles, 'citizen_reports/images', 'image')
      : Promise.resolve([]),
    audioFiles.length
      ? pushToCloudinary(audioFiles, 'citizen_reports/audio', 'video') // Cloudinary uses 'video' for audio
      : Promise.resolve([]),
  ]);

  const post = await Post.create({
    author:       req.user.id,
    title,
    description,
    category,
    constituency: constituency ?? null,
    tags:         tags ? JSON.parse(tags) : [],
    location:     location ? JSON.parse(location) : undefined,
    images,
    audio:        audioArr[0] ?? null,
  });

  res.status(201).json({ post });
};

exports.getPosts = async (req, res) => {
  const {
    page = 1, limit = 20,
    status, category, constituency,
    lat, lng, radiusKm,
    author,
  } = req.query;

  const filter = {};
  if (status)        filter.status        = status;
  if (category)      filter.category      = category;
  if (constituency)  filter.constituency  = constituency;
  if (author)        filter.author        = author;

  // Geo filter: ?lat=5.6&lng=-0.2&radiusKm=10
  if (lat && lng) {
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: (parseFloat(radiusKm) || 10) * 1000,
      },
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'firstName lastName'),
    Post.countDocuments(filter),
  ]);

  res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

exports.getPost = async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'firstName lastName email');
  if (!post) return res.status(404).json({ message: 'Report not found.' });
  res.json({ post });
};

exports.updatePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Report not found.' });

  const isOwner = post.author.toString() === req.user.id;
  const isPrivileged = ['admin', 'super_admin', 'moderator'].includes(req.user.role);
  if (!isOwner && !isPrivileged)
    return res.status(403).json({ message: 'Forbidden.' });

  const allowed = ['title', 'description', 'category', 'tags', 'location'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) post[field] = req.body[field];
  });

  await post.save();
  res.json({ post });
};

exports.updateStatus = async (req, res) => {
  const { status, officialResponse } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Report not found.' });

  post.status = status;
  if (officialResponse) post.officialResponse = officialResponse;
  if (status === 'resolved') post.resolvedAt = new Date();

  await post.save();
  res.json({ post });
};

exports.deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Report not found.' });

  const isOwner = post.author.toString() === req.user.id;
  const isPrivileged = ['admin', 'super_admin'].includes(req.user.role);
  if (!isOwner && !isPrivileged)
    return res.status(403).json({ message: 'Forbidden.' });

  // Clean up cloud assets
  await Promise.all([
    ...post.images.map((img) => deleteAsset(img.publicId, 'image')),
    post.audio ? deleteAsset(post.audio.publicId, 'video') : Promise.resolve(),
  ]);

  await post.deleteOne();
  res.json({ message: 'Report deleted.' });
};

exports.toggleUpvote = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Report not found.' });

  const uid = req.user.id;
  const idx = post.upvotes.indexOf(uid);

  // Fetch live verification status — the JWT may be stale if user just got verified
  const voter = await User.findById(uid).select('isVerifiedVoter');
  const isVerified = voter?.isVerifiedVoter ?? false;

  if (idx === -1) {
    post.upvotes.push(uid);
    // Remove from downvotes if switching vote
    const downIdx = post.downvotes.indexOf(uid);
    if (downIdx !== -1) post.downvotes.splice(downIdx, 1);
    // Track verified upvote for weighted scoring
    if (isVerified && !post.verifiedUpvotes.includes(uid)) {
      post.verifiedUpvotes.push(uid);
    }
  } else {
    post.upvotes.splice(idx, 1);
    const vIdx = post.verifiedUpvotes.indexOf(uid);
    if (vIdx !== -1) post.verifiedUpvotes.splice(vIdx, 1);
  }

  await post.save();
  res.json({
    upvoteCount:    post.upvotes.length,
    downvoteCount:  post.downvotes.length,
    verifiedCount:  post.verifiedUpvotes.length,
    score:          post.upvotes.length - post.downvotes.length,
    weightedScore:  post.upvotes.length + post.verifiedUpvotes.length * 2 - post.downvotes.length,
    upvoted:        idx === -1,
  });
};

exports.toggleDownvote = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Report not found.' });

  const uid = req.user.id;
  const idx = post.downvotes.indexOf(uid);
  if (idx === -1) {
    post.downvotes.push(uid);
    // Remove from upvotes if switching vote
    const upIdx = post.upvotes.indexOf(uid);
    if (upIdx !== -1) post.upvotes.splice(upIdx, 1);
  } else {
    post.downvotes.splice(idx, 1);
  }

  await post.save();
  res.json({
    upvoteCount:   post.upvotes.length,
    downvoteCount: post.downvotes.length,
    score:         post.upvotes.length - post.downvotes.length,
    downvoted:     idx === -1,
  });
};
