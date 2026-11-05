import mongoose from 'mongoose';
import { MAINTENANCE_STATUSES, MAINTENANCE_SEVERITIES } from '../utils/constants.js';

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: MAINTENANCE_STATUSES },
    note: { type: String, trim: true, maxlength: 500 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const maintenanceSchema = new mongoose.Schema(
  {
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    borrowing: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrowing' },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 1500 },
    severity: { type: String, enum: MAINTENANCE_SEVERITIES, default: 'medium' },
    images: [String],
    status: { type: String, enum: MAINTENANCE_STATUSES, default: 'reported', index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionNote: { type: String, trim: true, maxlength: 500 },
    // Units taken out of stock by this report (set when created from a damaged return).
    stockQuantity: { type: Number, min: 0, default: 0 },
    history: [historySchema],
  },
  { timestamps: true }
);

export default mongoose.model('Maintenance', maintenanceSchema);
