import mongoose from 'mongoose';
import { BORROWING_STATUSES } from '../utils/constants.js';

const borrowingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    purpose: { type: String, required: true, trim: true, maxlength: 500 },
    borrowDate: { type: Date, required: true }, // requested pick-up date
    dueDate: { type: Date, required: true },
    status: { type: String, enum: BORROWING_STATUSES, default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewNote: { type: String, trim: true, maxlength: 500 },
    borrowedAt: Date,
    returnedAt: Date,
    damagedQuantity: { type: Number, min: 0, default: 0 },
    returnNote: { type: String, trim: true, maxlength: 500 },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reminderSent: { type: Boolean, default: false },
    overdueNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Borrowing', borrowingSchema);
