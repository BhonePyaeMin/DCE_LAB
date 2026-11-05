import { env } from '../config/env.js';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Minutes since local midnight (laboratory time zone) for a Date. */
export function localMinutes(date) {
  const shifted = date.getTime() + env.LAB_UTC_OFFSET_MINUTES * MINUTE;
  return Math.floor(((shifted % DAY) + DAY) % DAY / MINUTE);
}

/** Index of the local calendar day (laboratory time zone) for a Date. */
export function localDayIndex(date) {
  return Math.floor((date.getTime() + env.LAB_UTC_OFFSET_MINUTES * MINUTE) / DAY);
}

export function parseHHMM(value) {
  const [h, m] = String(value).split(':').map(Number);
  return h * 60 + m;
}

export function parsePagination(query, defaults = { page: 1, limit: 20, max: 100 }) {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page);
  const limit = Math.min(defaults.max, Math.max(1, parseInt(query.limit, 10) || defaults.limit));
  return { page, limit, skip: (page - 1) * limit };
}

/** Neutralises spreadsheet formula injection in CSV cells. */
export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers, rows) {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) lines.push(row.map(csvCell).join(','));
  return lines.join('\r\n');
}
