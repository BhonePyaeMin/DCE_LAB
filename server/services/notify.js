import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../sockets/index.js';

/** Creates a notification for one or many users and pushes it over Socket.IO. */
export async function notify(userIds, { type = 'system', title, message, link }) {
  const ids = [...new Set([].concat(userIds).filter(Boolean).map(String))];
  if (!ids.length) return [];
  const docs = await Notification.insertMany(ids.map((user) => ({ user, type, title, message, link })));
  for (const doc of docs) emitToUser(doc.user, 'notification:new', doc.toObject());
  return docs;
}

export async function notifyAdmins(payload, { exclude } = {}) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  const ids = admins.map((a) => String(a._id)).filter((id) => id !== String(exclude));
  return notify(ids, payload);
}
