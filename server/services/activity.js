import ActivityLog from '../models/ActivityLog.js';

/** Records an audit entry. Never throws - logging must not break the request. */
export async function logActivity(req, { action, entity, entityId, description }) {
  try {
    await ActivityLog.create({
      user: req.user?._id,
      action,
      entity,
      entityId,
      description,
      ip: req.ip,
    });
  } catch (err) {
    console.error('[activity] failed to log', err.message);
  }
}
