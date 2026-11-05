import { z } from 'zod';
import Maintenance from '../models/Maintenance.js';
import Equipment from '../models/Equipment.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { parsePagination } from '../utils/helpers.js';
import { MAINTENANCE_STATUSES, MAINTENANCE_SEVERITIES, MAINTENANCE_OPEN_STATUSES } from '../utils/constants.js';
import { notify, notifyAdmins } from '../services/notify.js';
import { logActivity } from '../services/activity.js';
import { storeImages } from '../services/storage.js';
import { broadcastChange } from '../sockets/index.js';

export const createMaintenanceSchema = z.object({
  equipment: z.string().min(1),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(5).max(1500),
  severity: z.enum(MAINTENANCE_SEVERITIES).default('medium'),
});

export const updateMaintenanceSchema = z.object({
  status: z.enum(MAINTENANCE_STATUSES),
  note: z.string().trim().max(500).optional(),
  assignedTo: z.string().optional(),
});

const populate = [
  { path: 'equipment', select: 'name equipmentId category' },
  { path: 'reportedBy', select: 'name role' },
  { path: 'assignedTo', select: 'name' },
];

const STATUS_LABEL = {
  reported: 'Reported',
  under_review: 'Under review',
  in_progress: 'In progress',
  resolved: 'Resolved',
  unrepairable: 'Unrepairable',
};

export const createMaintenance = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.body.equipment).catch(() => null);
  if (!equipment) throw new AppError('Equipment not found', 404);
  const images = await storeImages(req.files);

  const report = await Maintenance.create({
    ...req.body,
    reportedBy: req.user._id,
    images,
    history: [{ status: 'reported', note: 'Report submitted', by: req.user._id }],
  });
  await logActivity(req, { action: 'maintenance.create', entity: 'Maintenance', entityId: report._id, description: `Reported issue on ${equipment.name}: ${report.title}` });
  await notifyAdmins(
    { type: 'maintenance', title: 'New maintenance report', message: `${req.user.name} reported an issue with ${equipment.name}.`, link: '/maintenance' },
    { exclude: req.user._id }
  );
  broadcastChange('maintenance', 'create', report._id);
  await report.populate(populate);
  res.status(201).json({ success: true, report });
});

export const listMaintenance = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.user.role === 'student') filter.reportedBy = req.user._id;
  if (req.query.status && MAINTENANCE_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.equipment) filter.equipment = req.query.equipment;
  const [items, total] = await Promise.all([
    Maintenance.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(populate),
    Maintenance.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

export const getMaintenance = asyncHandler(async (req, res) => {
  const report = await Maintenance.findById(req.params.id).populate([...populate, { path: 'history.by', select: 'name' }]);
  if (!report) throw new AppError('Report not found', 404);
  if (req.user.role === 'student' && String(report.reportedBy._id) !== String(req.user._id)) {
    throw new AppError('You cannot view this report', 403);
  }
  res.json({ success: true, report });
});

export const updateMaintenance = asyncHandler(async (req, res) => {
  const report = await Maintenance.findById(req.params.id).populate(populate);
  if (!report) throw new AppError('Report not found', 404);
  if (!MAINTENANCE_OPEN_STATUSES.includes(report.status)) throw new AppError(`This report is already ${STATUS_LABEL[report.status].toLowerCase()} and cannot be changed`, 409);

  const { status, note, assignedTo } = req.body;
  if (status === report.status && !assignedTo) throw new AppError('The report already has this status', 400);

  // Stock held back by a damaged return is released or written off when the case closes.
  if (report.stockQuantity > 0) {
    if (status === 'resolved') {
      await Equipment.updateOne({ _id: report.equipment._id }, { $inc: { available: report.stockQuantity, damaged: -report.stockQuantity } });
    } else if (status === 'unrepairable') {
      await Equipment.updateOne({ _id: report.equipment._id }, { $inc: { quantity: -report.stockQuantity, damaged: -report.stockQuantity } });
    }
  }

  report.status = status;
  if (assignedTo) report.assignedTo = assignedTo;
  if (['resolved', 'unrepairable'].includes(status)) report.resolutionNote = note;
  report.history.push({ status, note, by: req.user._id });
  await report.save();
  await report.populate('assignedTo', 'name');

  await logActivity(req, { action: `maintenance.${status}`, entity: 'Maintenance', entityId: report._id, description: `${report.equipment.name}: ${STATUS_LABEL[status]}` });
  await notify(report.reportedBy._id, {
    type: 'maintenance',
    title: 'Maintenance update',
    message: `Your report "${report.title}" is now ${STATUS_LABEL[status].toLowerCase()}.${note ? ` Note: ${note}` : ''}`,
    link: '/maintenance',
  });
  broadcastChange('maintenance', 'update', report._id);
  broadcastChange('equipment', 'update', report.equipment._id);
  res.json({ success: true, report });
});
