import Laboratory from '../models/Laboratory.js';
import Equipment from '../models/Equipment.js';
import Reservation from '../models/Reservation.js';
import Borrowing from '../models/Borrowing.js';
import Maintenance from '../models/Maintenance.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { toCsv } from '../utils/helpers.js';
import { MAINTENANCE_OPEN_STATUSES } from '../utils/constants.js';

const monthKey = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };

function rangeFrom(query) {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getFullYear(), to.getMonth() - 5, 1);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw new AppError('Invalid date range', 400);
  return { from, to };
}

export const dashboard = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;
  const now = new Date();
  const own = { user: _id };

  let reservationScope = own;
  if (role === 'admin') reservationScope = {};
  if (role === 'lecturer') reservationScope = { user: { $in: await User.find({ role: 'student' }).distinct('_id') } };
  const borrowingScope = role === 'admin' ? {} : own;

  const [
    laboratories,
    equipmentAgg,
    borrowedAgg,
    pendingReservations,
    pendingBorrowings,
    overdue,
    openMaintenance,
    upcoming,
    activity,
    conditions,
  ] = await Promise.all([
    Laboratory.countDocuments({ status: 'active' }),
    Equipment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, items: { $sum: 1 }, units: { $sum: '$quantity' }, available: { $sum: '$available' }, damaged: { $sum: '$damaged' } } },
    ]),
    Borrowing.aggregate([
      { $match: { ...borrowingScope, status: { $in: ['borrowed', 'overdue'] } } },
      { $group: { _id: null, units: { $sum: '$quantity' }, records: { $sum: 1 } } },
    ]),
    Reservation.countDocuments({ ...reservationScope, status: 'pending' }),
    Borrowing.countDocuments({ ...borrowingScope, status: 'pending' }),
    Borrowing.countDocuments({ ...borrowingScope, status: 'overdue' }),
    Maintenance.countDocuments({ ...(role === 'student' ? { reportedBy: _id } : {}), status: { $in: MAINTENANCE_OPEN_STATUSES } }),
    Reservation.find({ ...(role === 'student' ? own : {}), status: 'approved', endTime: { $gte: now } })
      .sort({ startTime: 1 })
      .limit(5)
      .populate('laboratory', 'name code')
      .populate('user', 'name'),
    ActivityLog.find(role === 'admin' ? {} : { user: _id }).sort({ createdAt: -1 }).limit(8).populate('user', 'name'),
    Equipment.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$condition', units: { $sum: '$quantity' }, items: { $sum: 1 } } }]),
  ]);

  const eq = equipmentAgg[0] || { items: 0, units: 0, available: 0, damaged: 0 };
  res.json({
    success: true,
    stats: {
      laboratories,
      equipmentItems: eq.items,
      totalUnits: eq.units,
      availableUnits: eq.available,
      damagedUnits: eq.damaged,
      borrowedUnits: borrowedAgg[0]?.units || 0,
      pendingReservations,
      pendingBorrowings,
      overdue,
      openMaintenance,
      upcomingSessions: upcoming.length,
    },
    upcomingSessions: upcoming,
    recentActivity: activity,
    conditionOverview: conditions.map((c) => ({ condition: c._id, units: c.units, items: c.items })),
  });
});

export const reports = asyncHandler(async (req, res) => {
  const { from, to } = rangeFrom(req.query);
  const inRange = { createdAt: { $gte: from, $lte: to } };

  const [utilization, labBookings, borrowingsByMonth, reservationsByMonth, overdueList, maintenanceByStatus, maintenanceTop, activityByMonth] =
    await Promise.all([
      Borrowing.aggregate([
        { $match: { ...inRange, status: { $in: ['borrowed', 'overdue', 'returned', 'damaged'] } } },
        { $group: { _id: '$equipment', borrowings: { $sum: 1 }, units: { $sum: '$quantity' } } },
        { $sort: { borrowings: -1, units: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'equipment', localField: '_id', foreignField: '_id', as: 'equipment' } },
        { $unwind: '$equipment' },
        { $project: { _id: 0, name: '$equipment.name', equipmentId: '$equipment.equipmentId', borrowings: 1, units: 1 } },
      ]),
      Reservation.aggregate([
        { $match: { startTime: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: '$laboratory',
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $in: ['$status', ['approved', 'completed']] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            hours: {
              $sum: {
                $cond: [{ $in: ['$status', ['approved', 'completed']] }, { $divide: [{ $subtract: ['$endTime', '$startTime'] }, 3600000] }, 0],
              },
            },
          },
        },
        { $sort: { total: -1 } },
        { $lookup: { from: 'laboratories', localField: '_id', foreignField: '_id', as: 'lab' } },
        { $unwind: '$lab' },
        { $project: { _id: 0, name: '$lab.name', code: '$lab.code', total: 1, approved: 1, rejected: 1, pending: 1, hours: { $round: ['$hours', 1] } } },
      ]),
      Borrowing.aggregate([{ $match: inRange }, { $group: { _id: monthKey, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Reservation.aggregate([{ $match: inRange }, { $group: { _id: monthKey, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Borrowing.find({ status: { $in: ['borrowed', 'overdue'] }, dueDate: { $lt: new Date() } })
        .sort({ dueDate: 1 })
        .limit(50)
        .populate('user', 'name email')
        .populate('equipment', 'name equipmentId'),
      Maintenance.aggregate([{ $match: inRange }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Maintenance.aggregate([
        { $match: inRange },
        { $group: { _id: '$equipment', reports: { $sum: 1 } } },
        { $sort: { reports: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'equipment', localField: '_id', foreignField: '_id', as: 'equipment' } },
        { $unwind: '$equipment' },
        { $project: { _id: 0, name: '$equipment.name', equipmentId: '$equipment.equipmentId', reports: 1 } },
      ]),
      ActivityLog.aggregate([{ $match: inRange }, { $group: { _id: monthKey, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);

  // Merge the per-month series so charts share one x-axis.
  const months = new Map();
  const add = (rows, key) => rows.forEach((r) => months.set(r._id, { ...(months.get(r._id) || { month: r._id, borrowings: 0, reservations: 0, activity: 0 }), [key]: r.count }));
  add(borrowingsByMonth, 'borrowings');
  add(reservationsByMonth, 'reservations');
  add(activityByMonth, 'activity');

  res.json({
    success: true,
    range: { from, to },
    equipmentUtilization: utilization,
    laboratoryBookings: labBookings,
    monthly: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)),
    overdue: overdueList,
    maintenance: { byStatus: maintenanceByStatus.map((m) => ({ status: m._id, count: m.count })), topEquipment: maintenanceTop },
  });
});

export const exportCsv = asyncHandler(async (req, res) => {
  const { from, to } = rangeFrom(req.query);
  const inRange = { createdAt: { $gte: from, $lte: to } };
  const type = req.params.type;
  let headers;
  let rows;

  switch (type) {
    case 'borrowings': {
      const items = await Borrowing.find(inRange).sort({ createdAt: -1 }).populate('user', 'name email').populate('equipment', 'name equipmentId');
      headers = ['Requested', 'User', 'Email', 'Equipment ID', 'Equipment', 'Quantity', 'Status', 'Borrow date', 'Due date', 'Returned at', 'Damaged units'];
      rows = items.map((b) => [b.createdAt, b.user?.name, b.user?.email, b.equipment?.equipmentId, b.equipment?.name, b.quantity, b.status, b.borrowDate, b.dueDate, b.returnedAt, b.damagedQuantity]);
      break;
    }
    case 'reservations': {
      const items = await Reservation.find(inRange).sort({ startTime: -1 }).populate('user', 'name email').populate('laboratory', 'name code');
      headers = ['Requested', 'User', 'Email', 'Laboratory', 'Start', 'End', 'Attendees', 'Status', 'Purpose'];
      rows = items.map((r) => [r.createdAt, r.user?.name, r.user?.email, r.laboratory?.name, r.startTime, r.endTime, r.attendees, r.status, r.purpose]);
      break;
    }
    case 'overdue': {
      const items = await Borrowing.find({ status: { $in: ['borrowed', 'overdue'] }, dueDate: { $lt: new Date() } }).sort({ dueDate: 1 }).populate('user', 'name email').populate('equipment', 'name equipmentId');
      headers = ['User', 'Email', 'Equipment ID', 'Equipment', 'Quantity', 'Due date', 'Days overdue'];
      rows = items.map((b) => [b.user?.name, b.user?.email, b.equipment?.equipmentId, b.equipment?.name, b.quantity, b.dueDate, Math.floor((Date.now() - b.dueDate.getTime()) / 86400000)]);
      break;
    }
    case 'maintenance': {
      const items = await Maintenance.find(inRange).sort({ createdAt: -1 }).populate('equipment', 'name equipmentId').populate('reportedBy', 'name');
      headers = ['Reported', 'Equipment ID', 'Equipment', 'Reported by', 'Title', 'Severity', 'Status', 'Resolution'];
      rows = items.map((m) => [m.createdAt, m.equipment?.equipmentId, m.equipment?.name, m.reportedBy?.name, m.title, m.severity, m.status, m.resolutionNote]);
      break;
    }
    case 'equipment': {
      const items = await Equipment.find().sort({ equipmentId: 1 });
      headers = ['Equipment ID', 'Name', 'Category', 'Total', 'Available', 'Damaged', 'Condition', 'Location'];
      rows = items.map((e) => [e.equipmentId, e.name, e.category, e.quantity, e.available, e.damaged, e.condition, e.location]);
      break;
    }
    default:
      throw new AppError('Unknown report type', 404);
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="dce-lab-${type}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(`﻿${toCsv(headers, rows)}`);
});
