const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: false, select: false },

    // Governance roles: super_admin can manage the whole platform,
    // admin manages an organization, moderator manages a workspace/committee,
    // member is a regular participant.
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'moderator', 'mp', 'member'],
      default: 'member',
    },

    organization:  { type: String, trim: true, default: null },
    constituency:  { type: String, trim: true, default: null },

    googleId:      { type: String, default: null, index: true, sparse: true },
    authProvider:  { type: String, enum: ['local', 'google'], default: 'local' },

    isEmailVerified: { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true },

    // Voter verification
    isVerifiedVoter:          { type: Boolean, default: false },
    voterVerificationStatus:  {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected'],
      default: 'none',
    },

    refreshToken: { type: String, select: false, default: null },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', UserSchema);
