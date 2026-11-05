import { z } from 'zod';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { logActivity } from '../services/activity.js';

const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password,
  role: z.enum(['student', 'lecturer']).default('student'),
  identifier: z.string().trim().max(40).optional(),
  department: z.string().trim().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  identifier: z.string().trim().max(40).optional(),
  department: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});

export const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });

const authResponse = (user) => ({ success: true, token: signToken(user._id), user });

export const register = asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) throw new AppError('Email is already registered', 409);
  const user = await User.create(req.body);
  req.user = user;
  await logActivity(req, { action: 'user.register', entity: 'User', entityId: user._id, description: `${user.name} registered as ${user.role}` });
  res.status(201).json(authResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('This account has been deactivated', 403);
  user.lastLoginAt = new Date();
  await user.save();
  res.json(authResponse(user));
});

export const me = (req, res) => res.json({ success: true, user: req.user });

export const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json({ success: true, user: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }
  user.password = req.body.newPassword;
  await user.save();
  await logActivity(req, { action: 'user.password_change', entity: 'User', entityId: user._id, description: 'Changed password' });
  res.json({ success: true, message: 'Password updated' });
});
