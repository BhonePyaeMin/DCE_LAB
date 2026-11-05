import Borrowing from '../models/Borrowing.js';
import { notify, notifyStaff } from './notify.js';
import { broadcastChange } from '../sockets/index.js';

const HOUR = 60 * 60 * 1000;

/** Flags overdue equipment and sends pick-up and return reminders. */
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
    await notifyStaff({ type: 'reminder', title: 'Overdue equipment', message: `${b.user.name} has not returned ${b.equipment.name}.`, link: '/borrowings' });
  }
  if (newlyOverdue.length) broadcastChange('borrowings', 'overdue');

  // Return reminders for items due within 24 hours.
  const dueSoon = await Borrowing.find({ status: 'borrowed', reminderSent: false, dueDate: { $gte: now, $lte: new Date(now.getTime() + 24 * HOUR) } }).populate('equipment', 'name');
  for (const b of dueSoon) {
    b.reminderSent = true;
    await b.save();
    await notify(b.user, { type: 'reminder', title: 'Return reminder', message: `${b.equipment.name} is due back on ${b.dueDate.toDateString()}.`, link: '/borrowings' });
  }

  // Pick-up reminders for approved requests whose pick-up day is within 24 hours (or has started).
  const pickupSoon = await Borrowing.find({ status: 'approved', pickupReminderSent: false, borrowDate: { $lte: new Date(now.getTime() + 24 * HOUR) } }).populate('equipment', 'name');
  for (const b of pickupSoon) {
    b.pickupReminderSent = true;
    await b.save();
    await notify(b.user, { type: 'reminder', title: 'Equipment ready for pick-up', message: `${b.quantity} x ${b.equipment.name} is approved. Collect it from the laboratory on ${b.borrowDate.toDateString()}.`, link: '/borrowings' });
  }

  return { overdue: newlyOverdue.length, returnReminders: dueSoon.length, pickupReminders: pickupSoon.length };
}

export function startScheduler(intervalMs = 5 * 60 * 1000) {
  const run = () => runScheduledJobs().catch((err) => console.error('[scheduler]', err.message));
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return timer;
}
