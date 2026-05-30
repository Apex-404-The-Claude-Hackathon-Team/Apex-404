const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema(
  {
    url:          { type: String, required: true },
    publicId:     { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'video', 'raw'], default: 'image' },
    format:       { type: String },
    bytes:        { type: Number },
    duration:     { type: Number }, // seconds, for audio
  },
  { _id: false }
);

// GeoJSON Point — enables $near / $geoWithin queries
const LocationSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }, // [longitude, latitude]
    address:     { type: String, trim: true },
    city:        { type: String, trim: true },
    region:      { type: String, trim: true },
    country:     { type: String, trim: true },
  },
  { _id: false }
);

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title:       { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },

    category: {
      type: String,
      enum: [
        'roads_transport',
        'water_sanitation',
        'electricity',
        'healthcare',
        'education',
        'corruption',
        'security',
        'flooding',
        'waste_management',
        'public_infrastructure',
        'other',
      ],
      default: 'other',
    },

    // Governance workflow status
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'rejected', 'ignored'],
      default: 'pending',
    },

    constituency: { type: String, trim: true, index: true, default: null },

    location: LocationSchema,

    images: { type: [MediaSchema], default: [] },
    audio:  { type: MediaSchema,  default: null },

    tags:           { type: [String], default: [] },
    upvotes:        { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    downvotes:      { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    // Subset of upvotes — verified voters only. Used to compute 3× weight.
    verifiedUpvotes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

    // Filled in by admin/moderator when status changes
    officialResponse: { type: String, default: null },
    resolvedAt:       { type: Date, default: null },

    // AI-generated summary (cached, regenerated if older than 7 days)
    aiSummary:   { type: String, default: null },
    aiSummaryAt: { type: Date,   default: null },
  },
  { timestamps: true }
);

// Geospatial index for location-based queries
PostSchema.index({ location: '2dsphere' });
PostSchema.index({ status: 1, category: 1 });
PostSchema.index({ author: 1 });

PostSchema.virtual('upvoteCount').get(function () {
  return this.upvotes.length;
});

PostSchema.virtual('downvoteCount').get(function () {
  return this.downvotes.length;
});

PostSchema.virtual('score').get(function () {
  return this.upvotes.length - this.downvotes.length;
});

// Verified voters count 3× — unverified +1, verified +3 (1 base + 2 bonus)
PostSchema.virtual('weightedScore').get(function () {
  return this.upvotes.length + this.verifiedUpvotes.length * 2 - this.downvotes.length;
});

module.exports = mongoose.model('Post', PostSchema);
