import Borrowing from '../models/Borrowing.js';
import Reservation from '../models/Reservation.js';
import { notify, notifyAdmins } from './notify.js';
import { broadcastChange } from '../sockets/index.js';

const HOUR = 60 * 60 * 1000;

/** Flags overdue equipment, sends reminders and closes finished reservations. */
export async function runScheduledJobs(now = new Date()) {
  // Equipment past its due date becomes overdue.
  const newlyOverdue = await Borrowing.find({ status: 'borrowed', dueDate: { $lt: now } })
    .populate('user', 'name')
    .populate('equipment', 'name');
  for (const b of newlyOverdue) {
    b.status = 'overdue';
    b.overdueNotified = true;
    await b.save();
    await notify(b.user._id, {
      type: 'reminder',
      title: 'Equipment overdue',
      message: `${b.equipment.name} was due on ${b.dueDate.toDateString()}. Please return it as soon as possible.`,
      link: '/borrowings',
    });
    await notifyAdmins({ type: 'reminder', title: 'Overdue equipment', message: `${b.user.name} has not returned ${b.equipment.name}.`, link: '/borrowings' });
  }
  if (newlyOverdue.length) broadcastChange('borrowings', 'overdue');

  // Return reminders for items due within 24 hours.
  const dueSoon = await Borrowing.find({ status: 'borrowed', reminderSent: false, dueDate: { $gte: now, $lte: new Date(now.getTime() + 24 * HOUR) } }).populate('equipment', 'name');
  for (const b of dueSoon) {
    b.reminderSent = true;
    await b.save();
    await notify(b.user, { type: 'reminder', title: 'Return reminder', message: `${b.equipment.name} is due back on ${b.dueDate.toDateString()}.`, link: '/borrowings' });
  }

  // Reminders for laboratory sessions starting within the hour.
  const startingSoon = await Reservation.find({ status: 'approved', reminderSent: false, startTime: { $gte: now, $lte: new Date(now.getTime() + HOUR) } }).populate('laboratory', 'name');
  for (const r of startingSoon) {
    r.reminderSent = true;
    await r.save();
    await notify(r.user, { type: 'reminder', title: 'Upcoming laboratory session', message: `Your session in ${r.laboratory.name} starts at ${r.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`, link: '/reservations' });
  }

  const completed = await Reservation.updateMany({ status: 'approved', endTime: { $lt: now } }, { status: 'completed' });

  return { overdue: newlyOverdue.length, returnReminders: dueSoon.length, sessionReminders: startingSoon.length, completed: completed.modifiedCount };
}

export function startScheduler(intervalMs = 5 * 60 * 1000) {
  const run = () => runScheduledJobs().catch((err) => console.error('[scheduler]', err.message));
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return timer;
}
