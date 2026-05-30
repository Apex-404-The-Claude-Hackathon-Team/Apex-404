const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { uploadStream, deleteAsset } = require('../config/cloudinary');

// ── helpers ──────────────────────────────────────────────────────────────────

const toMedia = (result) => ({
  url:          result.secure_url,
  publicId:     result.public_id,
  resourceType: 'image',
  format:       result.format,
  bytes:        result.bytes,
});

const pushImages = (files, folder) =>
  Promise.all(
    files.map((f) =>
      uploadStream(f.buffer, { folder, resource_type: 'image' }).then(toMedia)
    )
  );

// ── controllers ──────────────────────────────────────────────────────────────

exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const {
    title, description, category, status,
    constituency, location, budget,
    startDate, expectedEndDate,
  } = req.body;

  const imageFiles = req.files ?? [];
  const images = imageFiles.length
    ? await pushImages(imageFiles, 'civic_projects/images')
    : [];

  const project = await Project.create({
    author:      req.user.id,
    title,
    description,
    category,
    status:      status ?? 'budgeted',
    constituency: constituency ?? null,
    location:    location ? JSON.parse(location) : undefined,
    budget:      budget   ? Number(budget)        : null,
    startDate:   startDate       ?? null,
    expectedEndDate: expectedEndDate ?? null,
    images,
  });

  await project.populate('author', 'firstName lastName');
  res.status(201).json({ project });
};

exports.getProjects = async (req, res) => {
  const {
    page = 1, limit = 20,
    status, category, constituency,
    lat, lng, radiusKm,
  } = req.query;

  const filter = {};
  if (status)       filter.status       = status;
  if (category)     filter.category     = category;
  if (constituency) filter.constituency = constituency;

  if (lat && lng) {
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: (parseFloat(radiusKm) || 10) * 1000,
      },
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'firstName lastName'),
    Project.countDocuments(filter),
  ]);

  res.json({ projects, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

exports.getProject = async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('author', 'firstName lastName')
    .populate('updates.author', 'firstName lastName');
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  res.json({ project });
};

exports.updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found.' });

  const isOwner      = project.author.toString() === req.user.id;
  const isPrivileged = ['admin', 'super_admin'].includes(req.user.role);
  if (!isOwner && !isPrivileged)
    return res.status(403).json({ message: 'Forbidden.' });

  const allowed = [
    'title', 'description', 'category', 'constituency',
    'location', 'budget', 'startDate', 'expectedEndDate', 'actualEndDate',
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  await project.save();
  await project.populate('author', 'firstName lastName');
  res.json({ project });
};

exports.updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found.' });

  project.status = req.body.status;
  if (req.body.status === 'completed') project.actualEndDate = new Date();

  await project.save();

  if (project.constituency) {
    await Notification.create({
      constituency: project.constituency,
      title: 'Project Status Updated',
      message: `The project "${project.title}" status has been updated to "${req.body.status.replace(/_/g, ' ')}".`,
      type: 'project',
      relatedId: project._id,
    }).catch(err => console.error('Notification failed:', err));
  }

  res.json({ project });
};

exports.addUpdate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found.' });

  const imageFiles = req.files ?? [];
  const images = imageFiles.length
    ? await pushImages(imageFiles, 'civic_projects/updates')
    : [];

  project.updates.push({ author: req.user.id, body: req.body.body, images });
  await project.save();
  await project.populate('updates.author', 'firstName lastName');

  if (project.constituency) {
    await Notification.create({
      constituency: project.constituency,
      title: 'Project Progress Logged',
      message: `A new update has been posted on the project "${project.title}": "${req.body.body.slice(0, 100)}${req.body.body.length > 100 ? '...' : ''}"`,
      type: 'project',
      relatedId: project._id,
    }).catch(err => console.error('Notification failed:', err));
  }

  const latest = project.updates[project.updates.length - 1];
  res.status(201).json({ update: latest });
};

exports.deleteProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found.' });

  const allImages = [
    ...project.images,
    ...project.updates.flatMap((u) => u.images),
  ];
  await Promise.all(allImages.map((img) => deleteAsset(img.publicId, 'image')));

  await project.deleteOne();
  res.json({ message: 'Project deleted.' });
};
