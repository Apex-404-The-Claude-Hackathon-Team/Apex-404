const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    constituency: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['project', 'report'], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
