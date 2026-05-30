const Verification = require('../models/Verification');
const User         = require('../models/User');
const { verifyWithNIA } = require('../services/verificationService');

// POST /api/verification  — submit voter ID for verification
exports.submitVerification = async (req, res) => {
  // Prevent duplicate submissions
  const existing = await Verification.findOne({ user: req.user.id });
  if (existing) {
    if (existing.status === 'verified')
      return res.status(409).json({ message: 'You are already a verified voter.' });
    if (existing.status === 'pending')
      return res.status(409).json({ message: 'Your verification is already pending review.' });
    // rejected — allow resubmission by falling through
    await existing.deleteOne();
  }

  const { voterIdNumber, fullName, dateOfBirth, constituency } = req.body;

  if (!voterIdNumber || !fullName || !dateOfBirth || !constituency)
    return res.status(422).json({ message: 'voterIdNumber, fullName, dateOfBirth, and constituency are required.' });

  const result = await verifyWithNIA({ voterIdNumber, fullName, dateOfBirth: new Date(dateOfBirth), constituency });

  const status = result.verified ? 'verified' : 'pending';

  const record = await Verification.create({
    user: req.user.id,
    voterIdNumber,
    fullName,
    dateOfBirth:        new Date(dateOfBirth),
    constituency,
    status,
    verifiedAt:         result.verified ? new Date() : null,
    verificationMethod: result.method,
    verificationRef:    result.ref,
  });

  // Sync status to User document
  const userUpdate = { voterVerificationStatus: status };
  if (result.verified) userUpdate.isVerifiedVoter = true;
  await User.findByIdAndUpdate(req.user.id, userUpdate);

  res.status(201).json({
    message: result.verified
      ? 'Voter identity verified. Your votes now carry full democratic weight.'
      : 'Verification submitted and is pending review.',
    status,
    verificationId: record._id,
  });
};

// GET /api/verification/me  — check own verification status
exports.getMyVerification = async (req, res) => {
  const record = await Verification.findOne({ user: req.user.id }).select('-voterIdNumber');
  if (!record)
    return res.json({ status: 'none', message: 'No verification submitted yet.' });

  res.json({
    status:      record.status,
    submittedAt: record.createdAt,
    verifiedAt:  record.verifiedAt,
    rejectedAt:  record.rejectedAt,
    rejectionReason: record.rejectionReason,
  });
};

// GET /api/verification  — list all verifications (admin only)
exports.listVerifications = async (req, res) => {
  const { status, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [records, total] = await Promise.all([
    Verification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName email constituency'),
    Verification.countDocuments(filter),
  ]);

  res.json({ records, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

// PATCH /api/verification/:id  — approve or reject (admin only)
exports.reviewVerification = async (req, res) => {
  const { decision, rejectionReason } = req.body;
  if (!['approved', 'rejected'].includes(decision))
    return res.status(422).json({ message: 'decision must be "approved" or "rejected".' });

  const record = await Verification.findById(req.params.id);
  if (!record) return res.status(404).json({ message: 'Verification record not found.' });
  if (record.status !== 'pending')
    return res.status(409).json({ message: `Verification is already ${record.status}.` });

  const isApproved = decision === 'approved';

  record.status     = isApproved ? 'verified' : 'rejected';
  record.reviewedBy = req.user.id;
  if (isApproved) {
    record.verifiedAt = new Date();
  } else {
    record.rejectedAt      = new Date();
    record.rejectionReason = rejectionReason ?? null;
  }
  await record.save();

  const userUpdate = { voterVerificationStatus: record.status };
  if (isApproved) userUpdate.isVerifiedVoter = true;
  await User.findByIdAndUpdate(record.user, userUpdate);

  res.json({
    message: isApproved ? 'Voter verified.' : 'Verification rejected.',
    record,
  });
};
