import { z } from 'zod';
import Reservation from '../models/Reservation.js';
import Laboratory from '../models/Laboratory.js';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { localDayIndex, localMinutes, parseHHMM, parsePagination } from '../utils/helpers.js';
import { RESERVATION_STATUSES } from '../utils/constants.js';
import { notify, notifyAdmins } from '../services/notify.js';
import { logActivity } from '../services/activity.js';
import { broadcastChange } from '../sockets/index.js';

const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

export const createReservationSchema = z.object({
  laboratory: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  purpose: z.string().trim().min(3, 'Please describe the purpose').max(500),
  attendees: z.coerce.number().int().min(1).max(1000).default(1),
});

export const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(500).optional(),
});

export const scheduleQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  laboratory: z.string().optional(),
});

/** Finds an approved reservation overlapping the given window in the same laboratory. */
export function findConflict(laboratory, startTime, endTime, excludeId) {
  return Reservation.findOne({
    laboratory,
    status: 'approved',
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).populate('user', 'name');
}

function assertWithinOpeningHours(lab, start, end) {
  if (localDayIndex(start) !== localDayIndex(new Date(end.getTime() - 1))) {
    throw new AppError('A reservation must start and end on the same day', 400);
  }
  const startMin = localMinutes(start);
  const endMin = localMinutes(new Date(end.getTime() - 1)) + 1;
  if (startMin < parseHHMM(lab.openTime) || endMin > parseHHMM(lab.closeTime)) {
    throw new AppError(`${lab.name} is open from ${lab.openTime} to ${lab.closeTime}`, 400);
  }
}

const populate = [
  { path: 'user', select: 'name email role identifier' },
  { path: 'laboratory', select: 'name code location capacity' },
  { path: 'reviewedBy', select: 'name' },
];

export const createReservation = asyncHandler(async (req, res) => {
  const { laboratory, startTime, endTime, purpose, attendees } = req.body;
  const lab = await Laboratory.findById(laboratory).catch(() => null);
  if (!lab) throw new AppError('Laboratory not found', 404);
  if (lab.status !== 'active') throw new AppError(`This laboratory is currently ${lab.status} and cannot be reserved`, 409);
  if (endTime <= startTime) throw new AppError('End time must be after start time', 400);
  if (startTime.getTime() < Date.now() - 60 * 1000) throw new AppError('Start time must be in the future', 400);
  if (endTime - startTime > MAX_DURATION_MS) throw new AppError('A reservation cannot exceed 8 hours', 400);
  if (attendees > lab.capacity) throw new AppError(`This laboratory holds at most ${lab.capacity} people`, 400);
  assertWithinOpeningHours(lab, startTime, endTime);

  const conflict = await findConflict(lab._id, startTime, endTime);
  if (conflict) throw new AppError('This time slot overlaps with an approved reservation', 409);

  const reservation = await Reservation.create({ user: req.user._id, laboratory: lab._id, startTime, endTime, purpose, attendees });
  await logActivity(req, { action: 'reservation.create', entity: 'Reservation', entityId: reservation._id, description: `Requested ${lab.name}` });
  await notifyAdmins(
    { type: 'reservation', title: 'New reservation request', message: `${req.user.name} requested ${lab.name}.`, link: '/reservations' },
    { exclude: req.user._id }
  );
  broadcastChange('reservations', 'create', reservation._id);
  await reservation.populate(populate);
  res.status(201).json({ success: true, reservation });
});

export const listReservations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  const { role } = req.user;

  // Students only ever see their own requests; lecturers see their own plus student requests they review.
  if (role === 'student' || (role === 'lecturer' && req.query.scope !== 'review')) filter.user = req.user._id;
  if (role === 'lecturer' && req.query.scope === 'review') {
    const studentIds = await User.find({ role: 'student' }).distinct('_id');
    filter.user = { $in: studentIds };
  }
  if (role === 'admin' && req.query.mine === 'true') filter.user = req.user._id;
  if (req.query.status && RESERVATION_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.laboratory) filter.laboratory = req.query.laboratory;

  const [items, total] = await Promise.all([
    Reservation.find(filter).sort({ startTime: -1 }).skip(skip).limit(limit).populate(populate),
    Reservation.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

/** Calendar feed: approved and pending slots for every laboratory in a date range. */
export const schedule = asyncHandler(async (req, res) => {
  const { from, to, laboratory } = req.query;
  if (to - from > 62 * 24 * 60 * 60 * 1000) throw new AppError('Date range is too large (max 62 days)', 400);
  const filter = { status: { $in: ['approved', 'pending'] }, startTime: { $lt: to }, endTime: { $gt: from } };
  if (laboratory) filter.laboratory = laboratory;
  const items = await Reservation.find(filter).sort({ startTime: 1 }).populate('laboratory', 'name code').populate('user', 'name');
  const privileged = req.user.role !== 'student';
  res.json({
    success: true,
    items: items.map((r) => ({
      _id: r._id,
      laboratory: r.laboratory,
      startTime: r.startTime,
      endTime: r.endTime,
      status: r.status,
      mine: String(r.user?._id) === String(req.user._id),
      ...(privileged || String(r.user?._id) === String(req.user._id) ? { purpose: r.purpose, user: r.user } : {}),
    })),
  });
});

export const reviewReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate(populate);
  if (!reservation) throw new AppError('Reservation not found', 404);
  if (reservation.status !== 'pending') throw new AppError(`This reservation is already ${reservation.status}`, 409);
  if (req.user.role === 'lecturer' && reservation.user.role !== 'student') {
    throw new AppError('Lecturers can only review student requests', 403);
  }
  if (String(reservation.user._id) === String(req.user._id)) throw new AppError('You cannot review your own request', 403);

  const { status, note } = req.body;
  if (status === 'approved') {
    if (reservation.endTime <= new Date()) throw new AppError('This reservation is already in the past', 409);
    const lab = await Laboratory.findById(reservation.laboratory._id);
    if (!lab || lab.status !== 'active') throw new AppError('This laboratory is not available', 409);
    const conflict = await findConflict(reservation.laboratory._id, reservation.startTime, reservation.endTime, reservation._id);
    if (conflict) throw new AppError('Cannot approve: it overlaps with another approved reservation', 409);
  }

  reservation.status = status;
  reservation.reviewedBy = req.user._id;
  reservation.reviewedAt = new Date();
  reservation.reviewNote = note;
  await reservation.save();

  await logActivity(req, { action: `reservation.${status}`, entity: 'Reservation', entityId: reservation._id, description: `${status} ${reservation.laboratory.name} for ${reservation.user.name}` });
  await notify(reservation.user._id, {
    type: 'reservation',
    title: `Reservation ${status}`,
    message: `Your request for ${reservation.laboratory.name} was ${status}.${note ? ` Note: ${note}` : ''}`,
    link: '/reservations',
  });
  broadcastChange('reservations', status, reservation._id);
  res.json({ success: true, reservation });
});

export const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate(populate);
  if (!reservation) throw new AppError('Reservation not found', 404);
  const isOwner = String(reservation.user._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new AppError('You cannot cancel this reservation', 403);
  if (!['pending', 'approved'].includes(reservation.status)) throw new AppError(`A ${reservation.status} reservation cannot be cancelled`, 409);
  if (reservation.endTime <= new Date()) throw new AppError('This reservation is already over', 409);

  reservation.status = 'cancelled';
  await reservation.save();
  await logActivity(req, { action: 'reservation.cancel', entity: 'Reservation', entityId: reservation._id, description: `Cancelled ${reservation.laboratory.name}` });
  if (!isOwner) {
    await notify(reservation.user._id, {
      type: 'reservation',
      title: 'Reservation cancelled',
      message: `Your reservation for ${reservation.laboratory.name} was cancelled by an administrator.`,
      link: '/reservations',
    });
  } else if (reservation.reviewedBy) {
    await notify(reservation.reviewedBy._id, { type: 'reservation', title: 'Reservation cancelled', message: `${reservation.user.name} cancelled their reservation for ${reservation.laboratory.name}.`, link: '/reservations' });
  }
  broadcastChange('reservations', 'cancel', reservation._id);
  res.json({ success: true, reservation });
});
