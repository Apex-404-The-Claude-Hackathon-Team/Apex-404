const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
    address:     { type: String, trim: true },
    city:        { type: String, trim: true },
    region:      { type: String, trim: true },
    country:     { type: String, trim: true },
  },
  { _id: false }
);

const MediaSchema = new mongoose.Schema(
  {
    url:          { type: String, required: true },
    publicId:     { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'video', 'raw'], default: 'image' },
    format:       { type: String },
    bytes:        { type: Number },
  },
  { _id: false }
);

// Individual progress update posted by an MP/admin
const ProjectUpdateSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body:   { type: String, required: true, trim: true, maxlength: 2000 },
    images: { type: [MediaSchema], default: [] },
  },
  { timestamps: true }
);

const ProjectSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },

    category: {
      type: String,
      enum: [
        'roads_transport',
        'water_sanitation',
        'electricity',
        'healthcare',
        'education',
        'security',
        'flooding',
        'waste_management',
        'public_infrastructure',
        'other',
      ],
      default: 'other',
    },

    status: {
      type: String,
      enum: ['budgeted', 'in_progress', 'completed', 'delayed', 'budget_heavy', 'under_review'],
      default: 'budgeted',
    },

    constituency: { type: String, trim: true, index: true, default: null },

    location: LocationSchema,

    budget:          { type: Number, default: null },
    startDate:       { type: Date,   default: null },
    expectedEndDate: { type: Date,   default: null },
    actualEndDate:   { type: Date,   default: null },

    images:  { type: [MediaSchema],      default: [] },
    updates: { type: [ProjectUpdateSchema], default: [] },
  },
  { timestamps: true }
);

ProjectSchema.index({ location: '2dsphere' });
ProjectSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('Project', ProjectSchema);
