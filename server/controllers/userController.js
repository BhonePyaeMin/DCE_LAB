import { z } from 'zod';
import User from '../models/User.js';
import Borrowing from '../models/Borrowing.js';
import Maintenance from '../models/Maintenance.js';
import ActivityLog from '../models/ActivityLog.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { escapeRegex, parsePagination } from '../utils/helpers.js';
import { ROLES } from '../utils/constants.js';
import { logActivity } from '../services/activity.js';

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  role: z.enum(ROLES).default('student'),
  identifier: z.string().trim().max(40).optional(),
  department: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(ROLES).optional(),
  identifier: z.string().trim().max(40).optional(),
  department: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.role && ROLES.includes(req.query.role)) filter.role = req.query.role;
  if (req.query.active === 'true' || req.query.active === 'false') filter.isActive = req.query.active === 'true';
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { identifier: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

export const createUser = asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) throw new AppError('Email is already registered', 409);
  const user = await User.create(req.body);
  await logActivity(req, { action: 'user.create', entity: 'User', entityId: user._id, description: `Created ${user.role} account for ${user.email}` });
  res.status(201).json({ success: true, user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  const isSelf = String(user._id) === String(req.user._id);
  if (isSelf && (req.body.role && req.body.role !== user.role)) throw new AppError('You cannot change your own role', 400);
  if (isSelf && req.body.isActive === false) throw new AppError('You cannot deactivate your own account', 400);
  Object.assign(user, req.body);
  await user.save();
  await logActivity(req, { action: 'user.update', entity: 'User', entityId: user._id, description: `Updated account ${user.email}` });
  res.json({ success: true, user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (String(user._id) === String(req.user._id)) throw new AppError('You cannot delete your own account', 400);
  const [b, m] = await Promise.all([
    Borrowing.exists({ user: user._id }),
    Maintenance.exists({ reportedBy: user._id }),
  ]);
  if (b || m) throw new AppError('This user has records and cannot be deleted. Deactivate the account instead.', 409);
  await user.deleteOne();
  await logActivity(req, { action: 'user.delete', entity: 'User', entityId: user._id, description: `Deleted account ${user.email}` });
  res.json({ success: true });
});

export const listActivityLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 30, max: 100 });
  const filter = {};
  if (req.query.entity) filter.entity = String(req.query.entity);
  if (req.query.action) filter.action = new RegExp(`^${escapeRegex(String(req.query.action))}`);
  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email role'),
    ActivityLog.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});
