const mongoose = require('mongoose');

const VerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Ghana Electoral Commission / NIA voter details submitted by the user
    voterIdNumber: { type: String, required: true, trim: true },
    fullName:      { type: String, required: true, trim: true },
    dateOfBirth:   { type: Date,   required: true },
    constituency:  { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },

    // Timestamps for terminal states
    verifiedAt:      { type: Date,   default: null },
    rejectedAt:      { type: Date,   default: null },
    rejectionReason: { type: String, default: null },

    // External verification metadata (NIA API / Smile Identity in production)
    verificationMethod: {
      type: String,
      enum: ['placeholder', 'nia_api', 'smile_identity'],
      default: 'placeholder',
    },
    verificationRef:  { type: String, default: null }, // external reference ID

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

VerificationSchema.index({ status: 1 });

module.exports = mongoose.model('Verification', VerificationSchema);
