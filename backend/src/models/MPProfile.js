const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema(
  {
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
    format:   { type: String },
    bytes:    { type: Number },
  },
  { _id: false }
);

const MPProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    constituency: { type: String, required: true, trim: true, index: true },
    party:        { type: String, trim: true, default: null },
    bio:          { type: String, trim: true, maxlength: 1000, default: null },

    profilePhoto: { type: MediaSchema, default: null },

    // Optional public contact details
    contactEmail: { type: String, trim: true, lowercase: true, default: null },
    contactPhone: { type: String, trim: true, default: null },

    socialLinks: {
      twitter:   { type: String, trim: true, default: null },
      facebook:  { type: String, trim: true, default: null },
      instagram: { type: String, trim: true, default: null },
      website:   { type: String, trim: true, default: null },
    },

    termStart: { type: Date, default: null },
    termEnd:   { type: Date, default: null },

    // Set by admin after confirming the user is a real elected MP
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MPProfile', MPProfileSchema);
