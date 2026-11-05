import Notification from '../models/Notification.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { parsePagination } from '../utils/helpers.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20, max: 100 });
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.read = false;
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, items, total, unread, page, pages: Math.ceil(total / limit) });
});

export const markRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  if (!item) throw new AppError('Notification not found', 404);
  res.json({ success: true, notification: item });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

export const removeNotification = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) throw new AppError('Notification not found', 404);
  res.json({ success: true });
});
