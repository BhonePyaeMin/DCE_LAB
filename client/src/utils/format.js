import { format, formatDistanceToNowStrict, isSameDay } from 'date-fns';

export const fmtDate = (value) => (value ? format(new Date(value), 'd MMM yyyy') : '-');
export const fmtDateTime = (value) => (value ? format(new Date(value), 'd MMM yyyy, HH:mm') : '-');
export const fmtTime = (value) => (value ? format(new Date(value), 'HH:mm') : '-');
export const timeAgo = (value) => (value ? `${formatDistanceToNowStrict(new Date(value))} ago` : '-');

export function fmtRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return isSameDay(s, e) ? `${format(s, 'd MMM yyyy, HH:mm')} - ${format(e, 'HH:mm')}` : `${fmtDateTime(s)} - ${fmtDateTime(e)}`;
}

/** Value for <input type="datetime-local"> in the browser's local time zone. */
export const toLocalInput = (date) => format(date, "yyyy-MM-dd'T'HH:mm");
export const toDateInput = (date) => format(date, 'yyyy-MM-dd');

export const titleCase = (value = '') => value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const ROLE_LABEL = { student: 'Student', lecturer: 'Lecturer', admin: 'Administrator' };
