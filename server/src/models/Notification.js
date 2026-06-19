import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['job_match', 'application_update', 'skill_alert', 'system', 'profile_view'],
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    read:    { type: Boolean, default: false },
    link:    { type: String, default: null },   // internal navigation path, e.g. "/jobs/abc123"
    meta:    { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

// Supports: "get all notifications for this user, newest first"
notificationSchema.index({ user: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification