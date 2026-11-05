import { z } from 'zod';
import QRCode from 'qrcode';
import Equipment from '../models/Equipment.js';
import Borrowing from '../models/Borrowing.js';
import Maintenance from '../models/Maintenance.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { escapeRegex, parsePagination } from '../utils/helpers.js';
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CONDITIONS,
  BORROWING_ACTIVE_STATUSES,
  MAINTENANCE_OPEN_STATUSES,
} from '../utils/constants.js';
import { env } from '../config/env.js';
import { logActivity } from '../services/activity.js';
import { storeImage } from '../services/storage.js';
import { broadcastChange } from '../sockets/index.js';

const base = z.object({
  name: z.string().trim().min(2).max(140),
  category: z.enum(Object.keys(EQUIPMENT_CATEGORIES)),
  description: z.string().trim().max(1000).optional(),
  brand: z.string().trim().max(80).optional(),
  model: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  quantity: z.coerce.number().int().min(0).max(100000),
  condition: z.enum(EQUIPMENT_CONDITIONS).optional(),
  maxBorrowDays: z.coerce.number().int().min(1).max(90).optional(),
  isActive: z.preprocess((v) => (v === 'false' ? false : v === 'true' ? true : v), z.boolean()).optional(),
});

export const createEquipmentSchema = base;
export const updateEquipmentSchema = base.partial();

export const listEquipment = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 12, max: 100 });
  const filter = {};
  if (req.user.role !== 'admin') filter.isActive = true;
  if (req.query.category && EQUIPMENT_CATEGORIES[req.query.category]) filter.category = req.query.category;
  if (req.query.condition && EQUIPMENT_CONDITIONS.includes(req.query.condition)) filter.condition = req.query.condition;
  if (req.query.available === 'true') filter.available = { $gt: 0 };
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), 'i');
    filter.$or = [{ name: rx }, { equipmentId: rx }, { brand: rx }, { model: rx }];
  }
  const [items, total] = await Promise.all([
    Equipment.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Equipment.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

export const categories = (_req, res) =>
  res.json({ success: true, items: Object.entries(EQUIPMENT_CATEGORIES).map(([name, code]) => ({ name, code })) });

export const getEquipment = asyncHandler(async (req, res) => {
  const item = await Equipment.findById(req.params.id);
  if (!item || (!item.isActive && req.user.role !== 'admin')) throw new AppError('Equipment not found', 404);
  res.json({ success: true, equipment: item });
});

/** Resolves a scanned QR code to an equipment record plus the borrowing records the viewer may see. */
export const lookupByCode = asyncHandler(async (req, res) => {
  const item = await Equipment.findOne({ equipmentId: String(req.params.code).toUpperCase() });
  if (!item || (!item.isActive && req.user.role !== 'admin')) throw new AppError('No equipment matches this code', 404);

  const filter = { equipment: item._id, status: { $in: ['pending', ...BORROWING_ACTIVE_STATUSES] } };
  if (req.user.role === 'student') filter.user = req.user._id;
  const borrowings = await Borrowing.find(filter).sort({ createdAt: -1 }).limit(20).populate('user', 'name email identifier');
  res.json({ success: true, equipment: item, borrowings });
});

export const qrCode = asyncHandler(async (req, res) => {
  const item = await Equipment.findById(req.params.id);
  if (!item) throw new AppError('Equipment not found', 404);
  const url = `${env.CLIENT_URL.replace(/\/$/, '')}/scan/${item.equipmentId}`;
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 360, errorCorrectionLevel: 'M' });
  res.json({ success: true, code: item.equipmentId, url, dataUrl });
});

export const createEquipment = asyncHandler(async (req, res) => {
  const image = await storeImage(req.file);
  const item = await Equipment.create({
    ...req.body,
    available: req.body.quantity,
    ...(image ? { image } : {}),
  });
  await logActivity(req, { action: 'equipment.create', entity: 'Equipment', entityId: item._id, description: `Registered ${item.name} (${item.equipmentId})` });
  broadcastChange('equipment', 'create', item._id);
  res.status(201).json({ success: true, equipment: item });
});

export const updateEquipment = asyncHandler(async (req, res) => {
  const item = await Equipment.findById(req.params.id);
  if (!item) throw new AppError('Equipment not found', 404);

  if (req.body.quantity !== undefined) {
    // Units that are currently not on the shelf (reserved, borrowed or damaged) stay accounted for.
    const unitsOut = item.quantity - item.available;
    const available = req.body.quantity - unitsOut;
    if (available < 0) throw new AppError(`${unitsOut} unit(s) are currently reserved, borrowed or damaged, so the total cannot be below ${unitsOut}`, 409);
    item.available = available;
  }
  const image = await storeImage(req.file);
  Object.assign(item, req.body, image ? { image } : {});
  await item.save();
  await logActivity(req, { action: 'equipment.update', entity: 'Equipment', entityId: item._id, description: `Updated ${item.name} (${item.equipmentId})` });
  broadcastChange('equipment', 'update', item._id);
  res.json({ success: true, equipment: item });
});

export const deleteEquipment = asyncHandler(async (req, res) => {
  const item = await Equipment.findById(req.params.id);
  if (!item) throw new AppError('Equipment not found', 404);
  const [activeBorrowing, openMaintenance] = await Promise.all([
    Borrowing.exists({ equipment: item._id, status: { $in: ['pending', ...BORROWING_ACTIVE_STATUSES] } }),
    Maintenance.exists({ equipment: item._id, status: { $in: MAINTENANCE_OPEN_STATUSES } }),
  ]);
  if (activeBorrowing || openMaintenance) {
    throw new AppError('This equipment has open borrowing or maintenance records and cannot be deleted', 409);
  }
  await item.deleteOne();
  await logActivity(req, { action: 'equipment.delete', entity: 'Equipment', entityId: item._id, description: `Deleted ${item.name} (${item.equipmentId})` });
  broadcastChange('equipment', 'delete', item._id);
  res.json({ success: true });
});
