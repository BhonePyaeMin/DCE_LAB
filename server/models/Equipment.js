import mongoose from 'mongoose';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from '../utils/constants.js';
import { nextSequence } from './Counter.js';

const equipmentSchema = new mongoose.Schema(
  {
    equipmentId: { type: String, unique: true, index: true }, // generated, e.g. EQ-MCU-0001
    name: { type: String, required: true, trim: true, maxlength: 140 },
    category: { type: String, enum: Object.keys(EQUIPMENT_CATEGORIES), required: true, index: true },
    description: { type: String, trim: true, maxlength: 1000 },
    brand: { type: String, trim: true, maxlength: 80 },
    model: { type: String, trim: true, maxlength: 80 },
    location: { type: String, trim: true, maxlength: 120 },
    quantity: { type: Number, required: true, min: 0, default: 1 }, // total units owned
    available: { type: Number, min: 0, default: 1 }, // units free to be borrowed
    damaged: { type: Number, min: 0, default: 0 }, // units out of service after damage
    condition: { type: String, enum: EQUIPMENT_CONDITIONS, default: 'good', index: true },
    maxBorrowDays: { type: Number, min: 1, max: 90, default: 7 },
    image: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

equipmentSchema.pre('validate', async function generateId(next) {
  if (this.equipmentId) return next();
  const prefix = EQUIPMENT_CATEGORIES[this.category];
  if (!prefix) return next();
  const seq = await nextSequence(`equipment-${prefix}`);
  this.equipmentId = `EQ-${prefix}-${String(seq).padStart(4, '0')}`;
  next();
});

export default mongoose.model('Equipment', equipmentSchema);
