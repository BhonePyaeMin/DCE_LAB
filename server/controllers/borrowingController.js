import { z } from 'zod';
import Borrowing from '../models/Borrowing.js';
import Equipment from '../models/Equipment.js';
import Maintenance from '../models/Maintenance.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { parsePagination } from '../utils/helpers.js';
import { BORROWING_STATUSES } from '../utils/constants.js';
import { notify, notifyAdmins } from '../services/notify.js';
import { logActivity } from '../services/activity.js';
import { broadcastChange } from '../sockets/index.js';

const DAY = 24 * 60 * 60 * 1000;

export const createBorrowingSchema = z.object({
  equipment: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(1000).default(1),
  purpose: z.string().trim().min(3, 'Please describe the purpose').max(500),
  borrowDate: z.coerce.date(),
  dueDate: z.coerce.date(),
});

export const reviewBorrowingSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(500).optional(),
});

export const returnSchema = z.object({
  damagedQuantity: z.coerce.number().int().min(0).default(0),
  note: z.string().trim().max(500).optional(),
});

const populate = [
  { path: 'user', select: 'name email role identifier' },
  { path: 'equipment', select: 'name equipmentId category image' },
];

export const createBorrowing = asyncHandler(async (req, res) => {
  const { quantity, purpose, borrowDate, dueDate } = req.body;
  const equipment = await Equipment.findById(req.body.equipment).catch(() => null);
  if (!equipment || !equipment.isActive) throw new AppError('Equipment not found', 404);
  if (quantity > equipment.available) throw new AppError(`Only ${equipment.available} unit(s) are currently available`, 409);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (borrowDate < new Date(startOfToday.getTime() - DAY)) throw new AppError('Borrow date cannot be in the past', 400);
  if (dueDate <= borrowDate) throw new AppError('Due date must be after the borrow date', 400);
  if (dueDate - borrowDate > equipment.maxBorrowDays * DAY) {
    throw new AppError(`This equipment can be borrowed for at most ${equipment.maxBorrowDays} day(s)`, 400);
  }

  const overdue = await Borrowing.exists({ user: req.user._id, status: 'overdue' });
  if (overdue) throw new AppError('You have overdue equipment. Please return it before borrowing more.', 403);

  const borrowing = await Borrowing.create({ user: req.user._id, equipment: equipment._id, quantity, purpose, borrowDate, dueDate });
  await logActivity(req, { action: 'borrowing.create', entity: 'Borrowing', entityId: borrowing._id, description: `Requested ${quantity} x ${equipment.name}` });
  await notifyAdmins(
    { type: 'borrowing', title: 'New borrowing request', message: `${req.user.name} requested ${quantity} x ${equipment.name}.`, link: '/borrowings' },
    { exclude: req.user._id }
  );
  broadcastChange('borrowings', 'create', borrowing._id);
  await borrowing.populate(populate);
  res.status(201).json({ success: true, borrowing });
});

export const listBorrowings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  const { role } = req.user;
  const seesAll = role === 'admin' || (role === 'lecturer' && req.query.scope === 'all');
  if (!seesAll) filter.user = req.user._id;
  if (req.query.status && BORROWING_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.equipment) filter.equipment = req.query.equipment;
  if (seesAll && req.query.user) filter.user = req.query.user;

  const [items, total] = await Promise.all([
    Borrowing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(populate),
    Borrowing.countDocuments(filter),
  ]);
  const now = Date.now();
  res.json({
    success: true,
    items: items.map((b) => ({ ...b.toObject(), isOverdue: ['borrowed', 'overdue'].includes(b.status) && b.dueDate.getTime() < now })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

async function loadBorrowing(id) {
  const borrowing = await Borrowing.findById(id).populate(populate);
  if (!borrowing) throw new AppError('Borrowing record not found', 404);
  return borrowing;
}

export const reviewBorrowing = asyncHandler(async (req, res) => {
  const borrowing = await loadBorrowing(req.params.id);
  if (borrowing.status !== 'pending') throw new AppError(`This request is already ${borrowing.status}`, 409);
  const { status, note } = req.body;

  if (status === 'approved') {
    // Atomically reserve the stock so concurrent approvals cannot oversell it.
    const reserved = await Equipment.findOneAndUpdate(
      { _id: borrowing.equipment._id, isActive: true, available: { $gte: borrowing.quantity } },
      { $inc: { available: -borrowing.quantity } }
    );
    if (!reserved) throw new AppError('Not enough units are available to approve this request', 409);
  }

  borrowing.status = status;
  borrowing.reviewedBy = req.user._id;
  borrowing.reviewedAt = new Date();
  borrowing.reviewNote = note;
  await borrowing.save();

  await logActivity(req, { action: `borrowing.${status}`, entity: 'Borrowing', entityId: borrowing._id, description: `${status} ${borrowing.quantity} x ${borrowing.equipment.name} for ${borrowing.user.name}` });
  await notify(borrowing.user._id, {
    type: 'borrowing',
    title: `Borrowing request ${status}`,
    message: `Your request for ${borrowing.quantity} x ${borrowing.equipment.name} was ${status}.${status === 'approved' ? ' You can collect it from the laboratory.' : ''}${note ? ` Note: ${note}` : ''}`,
    link: '/borrowings',
  });
  broadcastChange('borrowings', status, borrowing._id);
  broadcastChange('equipment', 'update', borrowing.equipment._id);
  res.json({ success: true, borrowing });
});

export const collectBorrowing = asyncHandler(async (req, res) => {
  const borrowing = await loadBorrowing(req.params.id);
  if (borrowing.status !== 'approved') throw new AppError('Only approved requests can be collected', 409);
  borrowing.status = 'borrowed';
  borrowing.borrowedAt = new Date();
  borrowing.processedBy = req.user._id;
  await borrowing.save();
  await logActivity(req, { action: 'borrowing.collect', entity: 'Borrowing', entityId: borrowing._id, description: `${borrowing.user.name} collected ${borrowing.quantity} x ${borrowing.equipment.name}` });
  await notify(borrowing.user._id, {
    type: 'borrowing',
    title: 'Equipment checked out',
    message: `${borrowing.quantity} x ${borrowing.equipment.name} is checked out to you. Please return it by ${borrowing.dueDate.toDateString()}.`,
    link: '/borrowings',
  });
  broadcastChange('borrowings', 'collect', borrowing._id);
  res.json({ success: true, borrowing });
});

export const returnBorrowing = asyncHandler(async (req, res) => {
  const borrowing = await loadBorrowing(req.params.id);
  if (!['borrowed', 'overdue'].includes(borrowing.status)) throw new AppError('Only borrowed equipment can be returned', 409);
  const { damagedQuantity, note } = req.body;
  if (damagedQuantity > borrowing.quantity) throw new AppError('Damaged quantity cannot exceed the borrowed quantity', 400);

  const goodUnits = borrowing.quantity - damagedQuantity;
  await Equipment.updateOne(
    { _id: borrowing.equipment._id },
    { $inc: { available: goodUnits, damaged: damagedQuantity } }
  );

  borrowing.status = damagedQuantity > 0 ? 'damaged' : 'returned';
  borrowing.returnedAt = new Date();
  borrowing.damagedQuantity = damagedQuantity;
  borrowing.returnNote = note;
  borrowing.processedBy = req.user._id;
  await borrowing.save();

  if (damagedQuantity > 0) {
    const report = await Maintenance.create({
      equipment: borrowing.equipment._id,
      reportedBy: req.user._id,
      borrowing: borrowing._id,
      title: `Damaged on return: ${borrowing.equipment.name}`,
      description: note || `${damagedQuantity} unit(s) returned damaged by ${borrowing.user.name}.`,
      severity: 'high',
      stockQuantity: damagedQuantity,
      history: [{ status: 'reported', note: 'Created automatically from a damaged return', by: req.user._id }],
    });
    broadcastChange('maintenance', 'create', report._id);
  }

  await logActivity(req, { action: `borrowing.${borrowing.status}`, entity: 'Borrowing', entityId: borrowing._id, description: `${borrowing.user.name} returned ${borrowing.quantity} x ${borrowing.equipment.name}${damagedQuantity ? ` (${damagedQuantity} damaged)` : ''}` });
  await notify(borrowing.user._id, {
    type: 'borrowing',
    title: damagedQuantity ? 'Equipment returned with damage' : 'Equipment returned',
    message: damagedQuantity
      ? `${borrowing.equipment.name} was recorded as damaged on return (${damagedQuantity} unit(s)).`
      : `Thank you - ${borrowing.equipment.name} was returned in good condition.`,
    link: '/borrowings',
  });
  broadcastChange('borrowings', 'return', borrowing._id);
  broadcastChange('equipment', 'update', borrowing.equipment._id);
  res.json({ success: true, borrowing });
});

export const cancelBorrowing = asyncHandler(async (req, res) => {
  const borrowing = await loadBorrowing(req.params.id);
  const isOwner = String(borrowing.user._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new AppError('You cannot cancel this request', 403);
  if (!['pending', 'approved'].includes(borrowing.status)) throw new AppError(`A ${borrowing.status} request cannot be cancelled`, 409);

  if (borrowing.status === 'approved') {
    await Equipment.updateOne({ _id: borrowing.equipment._id }, { $inc: { available: borrowing.quantity } });
  }
  borrowing.status = 'cancelled';
  await borrowing.save();
  await logActivity(req, { action: 'borrowing.cancel', entity: 'Borrowing', entityId: borrowing._id, description: `Cancelled ${borrowing.quantity} x ${borrowing.equipment.name}` });
  if (!isOwner) {
    await notify(borrowing.user._id, { type: 'borrowing', title: 'Borrowing cancelled', message: `Your request for ${borrowing.equipment.name} was cancelled by an administrator.`, link: '/borrowings' });
  }
  broadcastChange('borrowings', 'cancel', borrowing._id);
  broadcastChange('equipment', 'update', borrowing.equipment._id);
  res.json({ success: true, borrowing });
});
