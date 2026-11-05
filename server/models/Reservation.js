import mongoose from 'mongoose';
import { RESERVATION_STATUSES } from '../utils/constants.js';

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    laboratory: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    purpose: { type: String, required: true, trim: true, maxlength: 500 },
    attendees: { type: Number, min: 1, default: 1 },
    status: { type: String, enum: RESERVATION_STATUSES, default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewNote: { type: String, trim: true, maxlength: 500 },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reservationSchema.index({ laboratory: 1, startTime: 1, endTime: 1 });

export default mongoose.model('Reservation', reservationSchema);
