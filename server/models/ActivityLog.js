import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    entity: { type: String, index: true },
    entityId: mongoose.Schema.Types.ObjectId,
    description: { type: String, maxlength: 400 },
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('ActivityLog', activityLogSchema);
