import { z } from 'zod';
import Laboratory from '../models/Laboratory.js';
import Reservation from '../models/Reservation.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { escapeRegex } from '../utils/helpers.js';
import { LAB_STATUSES } from '../utils/constants.js';
import { logActivity } from '../services/activity.js';
import { storeImage } from '../services/storage.js';
import { broadcastChange } from '../sockets/index.js';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format');

// multipart/form-data sends facilities as a comma separated string or repeated fields.
const facilities = z.preprocess(
  (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v),
  z.array(z.string().trim().max(60)).max(30)
);

const base = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(20),
  location: z.string().trim().max(160).optional(),
  capacity: z.coerce.number().int().min(1).max(1000),
  description: z.string().trim().max(1000).optional(),
  facilities: facilities.optional(),
  status: z.enum(LAB_STATUSES).optional(),
  openTime: hhmm.optional(),
  closeTime: hhmm.optional(),
});

const refineHours = (v) => !v.openTime || !v.closeTime || v.openTime < v.closeTime;
export const createLabSchema = base.refine(refineHours, { message: 'Opening time must be before closing time', path: ['closeTime'] });
export const updateLabSchema = base.partial().refine(refineHours, { message: 'Opening time must be before closing time', path: ['closeTime'] });

export const listLabs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && LAB_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), 'i');
    filter.$or = [{ name: rx }, { code: rx }, { location: rx }];
  }
  const items = await Laboratory.find(filter).sort({ name: 1 });
  res.json({ success: true, items });
});

export const getLab = asyncHandler(async (req, res) => {
  const lab = await Laboratory.findById(req.params.id);
  if (!lab) throw new AppError('Laboratory not found', 404);
  res.json({ success: true, lab });
});

export const createLab = asyncHandler(async (req, res) => {
  const image = await storeImage(req.file);
  const lab = await Laboratory.create({ ...req.body, ...(image ? { image } : {}) });
  await logActivity(req, { action: 'lab.create', entity: 'Laboratory', entityId: lab._id, description: `Created laboratory ${lab.name}` });
  broadcastChange('laboratories', 'create', lab._id);
  res.status(201).json({ success: true, lab });
});

export const updateLab = asyncHandler(async (req, res) => {
  const lab = await Laboratory.findById(req.params.id);
  if (!lab) throw new AppError('Laboratory not found', 404);
  const image = await storeImage(req.file);
  Object.assign(lab, req.body, image ? { image } : {});
  if (lab.openTime >= lab.closeTime) throw new AppError('Opening time must be before closing time', 400);
  await lab.save();
  await logActivity(req, { action: 'lab.update', entity: 'Laboratory', entityId: lab._id, description: `Updated laboratory ${lab.name}` });
  broadcastChange('laboratories', 'update', lab._id);
  res.json({ success: true, lab });
});

export const deleteLab = asyncHandler(async (req, res) => {
  const lab = await Laboratory.findById(req.params.id);
  if (!lab) throw new AppError('Laboratory not found', 404);
  const upcoming = await Reservation.exists({
    laboratory: lab._id,
    status: { $in: ['pending', 'approved'] },
    endTime: { $gte: new Date() },
  });
  if (upcoming) throw new AppError('This laboratory has upcoming reservations. Cancel them first or set the lab to closed.', 409);
  await lab.deleteOne();
  await logActivity(req, { action: 'lab.delete', entity: 'Laboratory', entityId: lab._id, description: `Deleted laboratory ${lab.name}` });
  broadcastChange('laboratories', 'delete', lab._id);
  res.json({ success: true });
});
