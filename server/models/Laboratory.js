import mongoose from 'mongoose';
import { LAB_STATUSES } from '../utils/constants.js';

const laboratorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20 },
    location: { type: String, trim: true, maxlength: 160 },
    capacity: { type: Number, required: true, min: 1 },
    description: { type: String, trim: true, maxlength: 1000 },
    facilities: [{ type: String, trim: true, maxlength: 60 }],
    status: { type: String, enum: LAB_STATUSES, default: 'active', index: true },
    openTime: { type: String, default: '08:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    closeTime: { type: String, default: '20:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    image: String,
  },
  { timestamps: true }
);

export default mongoose.model('Laboratory', laboratorySchema);
