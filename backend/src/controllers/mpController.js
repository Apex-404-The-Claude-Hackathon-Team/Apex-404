const { validationResult } = require('express-validator');
const MPProfile = require('../models/MPProfile');
const User      = require('../models/User');
const { uploadStream, deleteAsset } = require('../config/cloudinary');

// Fields the MP is allowed to set on their own profile
const EDITABLE = [
  'constituency', 'party', 'bio',
  'contactEmail', 'contactPhone', 'socialLinks',
  'termStart', 'termEnd',
];

exports.listMPs = async (req, res) => {
  const { constituency, party, verified } = req.query;

  const filter = {};
  if (constituency) filter.constituency = constituency;
  if (party)        filter.party        = party;
  if (verified !== undefined) filter.isVerified = verified === 'true';

  const profiles = await MPProfile.find(filter)
    .populate('user', 'firstName lastName email')
    .sort({ constituency: 1 });

  res.json({ profiles });
};

exports.getMPByConstituency = async (req, res) => {
  const profile = await MPProfile.findOne({ constituency: req.params.constituency })
    .populate('user', 'firstName lastName email');

  if (!profile) return res.status(404).json({ message: 'No MP profile found for this constituency.' });
  res.json({ profile });
};

exports.getMyProfile = async (req, res) => {
  const profile = await MPProfile.findOne({ user: req.user.id })
    .populate('user', 'firstName lastName email constituency');

  if (!profile) return res.status(404).json({ message: 'MP profile not created yet.' });
  res.json({ profile });
};

exports.upsertProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const update = {};
  EDITABLE.forEach((field) => {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  });

  // Keep constituency in sync with the User record
  if (update.constituency) {
    await User.findByIdAndUpdate(req.user.id, { constituency: update.constituency });
  }

  const profile = await MPProfile.findOneAndUpdate(
    { user: req.user.id },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).populate('user', 'firstName lastName email');

  res.status(200).json({ profile });
};

exports.uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image file provided.' });

  const profile = await MPProfile.findOne({ user: req.user.id });
  if (!profile) return res.status(404).json({ message: 'Create your MP profile first.' });

  // Remove old photo from Cloudinary if one exists
  if (profile.profilePhoto?.publicId) {
    await deleteAsset(profile.profilePhoto.publicId, 'image').catch(() => {});
  }

  const result = await uploadStream(req.file.buffer, {
    folder:          'mp_profiles/photos',
    resource_type:   'image',
    transformation:  [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  });

  profile.profilePhoto = {
    url:      result.secure_url,
    publicId: result.public_id,
    format:   result.format,
    bytes:    result.bytes,
  };

  await profile.save();
  res.json({ profilePhoto: profile.profilePhoto });
};

exports.verifyMP = async (req, res) => {
  const profile = await MPProfile.findOne({ user: req.params.userId })
    .populate('user', 'firstName lastName email');

  if (!profile) return res.status(404).json({ message: 'MP profile not found.' });

  profile.isVerified = true;
  await profile.save();
  res.json({ profile });
};
