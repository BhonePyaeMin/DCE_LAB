import { z } from 'zod';
import Borrowing from '../models/Borrowing.js';
import Equipment from '../models/Equipment.js';
import User from '../models/User.js';
import BorrowTransaction from '../models/BorrowTransaction.js';
import { nextSequence } from '../models/Counter.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { escapeRegex } from '../utils/helpers.js';
import { isStaff } from '../utils/constants.js';
import { notify } from '../services/notify.js';
import { logActivity } from '../services/activity.js';
import { broadcastChange } from '../sockets/index.js';

// Lab counter: borrowing in person, signed by the student and then by the lab assistant.

const DAY = 24 * 60 * 60 * 1000;
const BORROWER_ROLES = ['student', 'lecturer'];
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const signature = z
  .string()
  .max(200_000, 'Signature is too large')
  .regex(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/, 'Signature must be a PNG image')
  .refine((v) => Buffer.from(v.slice(22, 60), 'base64').subarray(0, 4).equals(PNG_MAGIC), 'Signature must be a PNG image');

export const counterQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const counterBorrowSchema = z.object({
  student: z.string().min(1),
  items: z
    .array(z.object({ equipment: z.string().min(1), quantity: z.coerce.number().int().min(1).max(1000).default(1) }))
    .min(1, 'Add at least one item')
    .max(30),
  purpose: z.string().trim().max(500).optional(),
  dueDate: z.coerce.date(),
  studentSignature: signature,
  assistantSignature: signature,
});

const receiptPopulate = [
  { path: 'student', select: 'name email identifier department role' },
  { path: 'assistant', select: 'name role' },
  { path: 'items.equipment', select: 'name equipmentId itemNo category image' },
];

/** Why a person cannot borrow right now, or '' when they can. */
async function borrowBlocker(user) {
  if (!BORROWER_ROLES.includes(user.role)) return 'Only students and lecturers can borrow equipment';
  if (!user.isActive) return 'This account is deactivated';
  if (await Borrowing.exists({ user: user._id, status: 'overdue' })) return 'Has overdue equipment that must be returned first';
  return '';
}

/** Step 1: find the student by Student ID, name or email. */
export const students = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  const filter = { role: { $in: BORROWER_ROLES } };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ identifier: rx }, { name: rx }, { email: rx }];
  }
  const users = await User.find(filter).sort({ identifier: 1, name: 1 }).limit(limit);
  const loans = await Borrowing.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $in: ['borrowed', 'overdue'] } } },
    { $group: { _id: '$user', active: { $sum: '$quantity' } } },
  ]);
  const active = new Map(loans.map((l) => [String(l._id), l.active]));
  const items = await Promise.all(
    users.map(async (u) => {
      const reason = await borrowBlocker(u);
      return { ...u.toJSON(), activeItems: active.get(String(u._id)) || 0, eligible: !reason, reason };
    })
  );
  res.json({ success: true, items });
});

/** Step 2 (Select Item ID): registered equipment with its ID, name and availability. */
export const items = asyncHandler(async (req, res) => {
  const { q, limit = 50 } = req.query;
  const filter = { isActive: true };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { equipmentId: rx }, { brand: rx }, { model: rx }];
    if (/^\d{1,9}$/.test(q)) filter.$or.push({ itemNo: Number(q) });
  }
  const found = await Equipment.find(filter).sort({ itemNo: 1 }).limit(limit);
  res.json({
    success: true,
    items: found.map((e) => {
      const out = e.quantity - e.available - e.damaged;
      return { ...e.toJSON(), status: e.available > 0 ? 'available' : out > 0 ? 'borrowed' : 'unavailable' };
    }),
  });
});

const endOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

/** Steps 3 and 4: both signatures are in, so the borrowing is finalised and the stock goes out. */
export const borrow = asyncHandler(async (req, res) => {
  const { items: requested, purpose, dueDate, studentSignature, assistantSignature } = req.body;
  const student = await User.findById(req.body.student).catch(() => null);
  if (!student) throw new AppError('Student not found', 404);
  const blocker = await borrowBlocker(student);
  if (blocker) throw new AppError(`${student.name}: ${blocker}`, 403);

  const merged = new Map();
  for (const line of requested) merged.set(line.equipment, (merged.get(line.equipment) || 0) + line.quantity);
  const lines = [];
  for (const [id, quantity] of merged) {
    const equipment = await Equipment.findById(id).catch(() => null);
    if (!equipment || !equipment.isActive) throw new AppError('One of the items could not be found', 404);
    if (quantity > equipment.available) {
      throw new AppError(equipment.available === 0 ? `${equipment.name} is not available right now` : `Only ${equipment.available} unit(s) of ${equipment.name} are available`, 409);
    }
    lines.push({ equipment, quantity });
  }

  const now = new Date();
  const shortestLoan = Math.min(...lines.map((l) => l.equipment.maxBorrowDays));
  if (dueDate <= now) throw new AppError('Due date must be in the future', 400);
  if (dueDate > endOfDay(new Date(now.getTime() + shortestLoan * DAY))) {
    throw new AppError(`These items can be borrowed for at most ${shortestLoan} day(s)`, 400);
  }

  // Atomically take the stock; give back whatever was taken if a later item cannot be reserved.
  const reserved = [];
  const release = () => Promise.all(reserved.map((l) => Equipment.updateOne({ _id: l.equipment._id }, { $inc: { available: l.quantity } })));
  for (const line of lines) {
    const ok = await Equipment.findOneAndUpdate({ _id: line.equipment._id, isActive: true, available: { $gte: line.quantity } }, { $inc: { available: -line.quantity } });
    if (!ok) {
      await release();
      throw new AppError(`${line.equipment.name} was just taken by someone else`, 409);
    }
    reserved.push(line);
  }

  const reason = purpose || 'Laboratory use';
  const created = [];
  let transaction;
  try {
    transaction = new BorrowTransaction({
      code: `BR-${String(await nextSequence('borrow-transaction')).padStart(5, '0')}`,
      student: student._id,
      assistant: req.user._id,
      purpose: reason,
      dueDate,
      studentSignature,
      studentSignedAt: now,
      assistantSignature,
      assistantSignedAt: now,
    });
    for (const line of lines) {
      const borrowing = await Borrowing.create({
        user: student._id,
        equipment: line.equipment._id,
        quantity: line.quantity,
        purpose: reason,
        borrowDate: now,
        dueDate,
        status: 'borrowed',
        borrowedAt: now,
        reviewedBy: req.user._id,
        reviewedAt: now,
        processedBy: req.user._id,
        transaction: transaction._id,
      });
      created.push(borrowing);
      transaction.items.push({ equipment: line.equipment._id, borrowing: borrowing._id, quantity: line.quantity });
    }
    await transaction.save();
  } catch (err) {
    await Borrowing.deleteMany({ _id: { $in: created.map((b) => b._id) } });
    await release();
    throw err;
  }

  const summary = lines.map((l) => `${l.quantity} x ${l.equipment.name}`).join(', ');
  await logActivity(req, { action: 'borrowing.counter', entity: 'BorrowTransaction', entityId: transaction._id, description: `${transaction.code}: ${student.name} borrowed ${summary}` });
  await notify(student._id, {
    type: 'borrowing',
    title: 'Equipment borrowed',
    message: `${summary} ${lines.length > 1 ? 'are' : 'is'} checked out to you (${transaction.code}). Please return by ${dueDate.toDateString()}.`,
    link: '/borrowings',
  });
  broadcastChange('borrowings', 'create', transaction._id);
  for (const line of lines) broadcastChange('equipment', 'update', line.equipment._id);

  await transaction.populate(receiptPopulate);
  res.status(201).json({ success: true, transaction });
});

/** The signed receipt, visible to staff and to the student it belongs to. */
export const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await BorrowTransaction.findById(req.params.id).populate(receiptPopulate);
  if (!transaction) throw new AppError('Receipt not found', 404);
  if (!isStaff(req.user.role) && String(transaction.student._id) !== String(req.user._id)) throw new AppError('Receipt not found', 404);
  res.json({ success: true, transaction });
});
