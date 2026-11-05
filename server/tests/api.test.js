import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';

const { connectDB, disconnectDB } = await import('../config/db.js');
const { default: app } = await import('../app.js');
const { default: User } = await import('../models/User.js');
const { default: Borrowing } = await import('../models/Borrowing.js');
const { default: Equipment } = await import('../models/Equipment.js');
const { runScheduledJobs } = await import('../services/scheduler.js');
const { csvCell } = await import('../utils/helpers.js');

let server;
let base;
const tokens = {};
const ids = {};

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${base}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, body: json };
}

// A slot tomorrow at the given lab-local hour (lab time zone is UTC+7 by default).
function slot(dayOffset, startHour, endHour) {
  const offset = Number(process.env.LAB_UTC_OFFSET_MINUTES ?? 420);
  const midnight = new Date();
  midnight.setUTCHours(0, 0, 0, 0);
  const at = (h) => new Date(midnight.getTime() + dayOffset * 86400000 + (h * 60 - offset) * 60000).toISOString();
  return { startTime: at(startHour), endTime: at(endHour) };
}

before(async () => {
  await connectDB();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;

  await User.create({ name: 'Admin', email: 'admin@t.test', password: 'password123', role: 'admin' });
  await User.create({ name: 'Lecturer', email: 'lecturer@t.test', password: 'password123', role: 'lecturer' });
  for (const role of ['admin', 'lecturer']) {
    const res = await api('POST', '/auth/login', { body: { email: `${role}@t.test`, password: 'password123' } });
    tokens[role] = res.body.token;
  }
});

after(async () => {
  server?.close();
  await disconnectDB();
});

test('auth: registration, login and role protection', async () => {
  let res = await api('POST', '/auth/register', { body: { name: 'Stu Dent', email: 'stu@t.test', password: 'password123' } });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, 'student');
  assert.equal(res.body.user.password, undefined);
  tokens.student = res.body.token;

  // Self-registration can never create an admin.
  res = await api('POST', '/auth/register', { body: { name: 'Evil', email: 'evil@t.test', password: 'password123', role: 'admin' } });
  assert.equal(res.status, 400);

  res = await api('POST', '/auth/register', { body: { name: 'Dup', email: 'stu@t.test', password: 'password123' } });
  assert.equal(res.status, 409);

  res = await api('POST', '/auth/login', { body: { email: 'stu@t.test', password: 'wrong-password' } });
  assert.equal(res.status, 401);

  assert.equal((await api('GET', '/auth/me')).status, 401);
  assert.equal((await api('GET', '/users', { token: tokens.student })).status, 403);
  assert.equal((await api('GET', '/users', { token: tokens.admin })).status, 200);
});

test('laboratories: only admins manage them', async () => {
  const payload = { name: 'Test Lab', code: 'tl-1', capacity: 20, openTime: '08:00', closeTime: '18:00', facilities: ['Projector'] };
  assert.equal((await api('POST', '/laboratories', { token: tokens.student, body: payload })).status, 403);
  const res = await api('POST', '/laboratories', { token: tokens.admin, body: payload });
  assert.equal(res.status, 201);
  assert.equal(res.body.lab.code, 'TL-1');
  ids.lab = res.body.lab._id;
  assert.equal((await api('POST', '/laboratories', { token: tokens.admin, body: payload })).status, 409);
  assert.equal((await api('GET', '/laboratories/not-an-id', { token: tokens.admin })).status, 400);
});

test('reservations: validation, conflicts and approval workflow', async () => {
  const body = (extra) => ({ laboratory: ids.lab, purpose: 'Group study session', attendees: 5, ...extra });

  // Outside opening hours (06:00-08:00).
  let res = await api('POST', '/reservations', { token: tokens.student, body: body(slot(1, 6, 8)) });
  assert.equal(res.status, 400);
  // In the past.
  res = await api('POST', '/reservations', { token: tokens.student, body: body(slot(-1, 10, 12)) });
  assert.equal(res.status, 400);
  // Over capacity.
  res = await api('POST', '/reservations', { token: tokens.student, body: body({ ...slot(1, 10, 12), attendees: 99 }) });
  assert.equal(res.status, 400);

  res = await api('POST', '/reservations', { token: tokens.student, body: body(slot(1, 10, 12)) });
  assert.equal(res.status, 201);
  ids.reservation = res.body.reservation._id;

  // A second overlapping request can be filed while the first is only pending...
  res = await api('POST', '/reservations', { token: tokens.lecturer, body: body(slot(1, 11, 13)) });
  assert.equal(res.status, 201);
  ids.reservation2 = res.body.reservation._id;

  // ...but students cannot review, and the requester cannot approve their own.
  assert.equal((await api('PATCH', `/reservations/${ids.reservation}/review`, { token: tokens.student, body: { status: 'approved' } })).status, 403);

  res = await api('PATCH', `/reservations/${ids.reservation}/review`, { token: tokens.lecturer, body: { status: 'approved' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.reservation.status, 'approved');

  // Now the overlapping one can no longer be approved, and new overlapping requests are rejected outright.
  res = await api('PATCH', `/reservations/${ids.reservation2}/review`, { token: tokens.admin, body: { status: 'approved' } });
  assert.equal(res.status, 409);
  res = await api('POST', '/reservations', { token: tokens.student, body: body(slot(1, 9, 11)) });
  assert.equal(res.status, 409);
  // Back-to-back is fine.
  res = await api('POST', '/reservations', { token: tokens.student, body: body(slot(1, 12, 13)) });
  assert.equal(res.status, 201);

  // The student was notified about the decision.
  res = await api('GET', '/notifications', { token: tokens.student });
  assert.ok(res.body.items.some((n) => n.title === 'Reservation approved'));
  assert.ok(res.body.unread >= 1);

  // Calendar feed hides purposes of other people's bookings from students.
  const from = new Date(Date.now() - 86400000).toISOString();
  const to = new Date(Date.now() + 5 * 86400000).toISOString();
  res = await api('GET', `/reservations/schedule?from=${from}&to=${to}`, { token: tokens.student });
  assert.equal(res.status, 200);
  const others = res.body.items.filter((i) => !i.mine);
  assert.ok(others.length > 0);
  assert.ok(others.every((i) => i.purpose === undefined));

  res = await api('PATCH', `/reservations/${ids.reservation}/cancel`, { token: tokens.lecturer });
  assert.equal(res.status, 403);
  res = await api('PATCH', `/reservations/${ids.reservation}/cancel`, { token: tokens.student });
  assert.equal(res.status, 200);
});

test('equipment: generated IDs, QR codes and stock accounting through borrowing and maintenance', async () => {
  let res = await api('POST', '/equipment', { token: tokens.admin, body: { name: 'ESP32 Board', category: 'Arduino and ESP32', quantity: 5, available: 999, maxBorrowDays: 7 } });
  assert.equal(res.status, 201);
  assert.match(res.body.equipment.equipmentId, /^EQ-MCU-\d{4}$/);
  assert.equal(res.body.equipment.available, 5, 'client cannot set available stock');
  ids.equipment = res.body.equipment._id;
  const code = res.body.equipment.equipmentId;

  res = await api('GET', `/equipment/${ids.equipment}/qr`, { token: tokens.admin });
  assert.ok(res.body.dataUrl.startsWith('data:image/png;base64,'));
  assert.ok(res.body.url.endsWith(`/scan/${code}`));

  res = await api('GET', `/equipment/code/${code}`, { token: tokens.student });
  assert.equal(res.status, 200);
  assert.equal(res.body.equipment.name, 'ESP32 Board');

  const today = new Date().toISOString();
  const inDays = (d) => new Date(Date.now() + d * 86400000).toISOString();
  const request = (extra) => ({ equipment: ids.equipment, quantity: 2, purpose: 'Sensor project', borrowDate: today, dueDate: inDays(3), ...extra });

  // Validation: too many units, too long, backwards dates.
  assert.equal((await api('POST', '/borrowings', { token: tokens.student, body: request({ quantity: 6 }) })).status, 409);
  assert.equal((await api('POST', '/borrowings', { token: tokens.student, body: request({ dueDate: inDays(30) }) })).status, 400);
  assert.equal((await api('POST', '/borrowings', { token: tokens.student, body: request({ dueDate: inDays(-1) }) })).status, 400);

  res = await api('POST', '/borrowings', { token: tokens.student, body: request() });
  assert.equal(res.status, 201);
  ids.borrowing = res.body.borrowing._id;

  // Only admins review; approval reserves stock.
  assert.equal((await api('PATCH', `/borrowings/${ids.borrowing}/review`, { token: tokens.lecturer, body: { status: 'approved' } })).status, 403);
  res = await api('PATCH', `/borrowings/${ids.borrowing}/review`, { token: tokens.admin, body: { status: 'approved' } });
  assert.equal(res.status, 200);
  assert.equal((await Equipment.findById(ids.equipment)).available, 3);
  // Cannot approve twice (would double-reserve).
  assert.equal((await api('PATCH', `/borrowings/${ids.borrowing}/review`, { token: tokens.admin, body: { status: 'approved' } })).status, 409);
  // Cannot return before collection.
  assert.equal((await api('PATCH', `/borrowings/${ids.borrowing}/return`, { token: tokens.admin, body: {} })).status, 409);

  res = await api('PATCH', `/borrowings/${ids.borrowing}/collect`, { token: tokens.admin });
  assert.equal(res.body.borrowing.status, 'borrowed');

  // One unit comes back damaged.
  res = await api('PATCH', `/borrowings/${ids.borrowing}/return`, { token: tokens.admin, body: { damagedQuantity: 1, note: 'Cracked USB port' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.borrowing.status, 'damaged');
  let eq = await Equipment.findById(ids.equipment);
  assert.deepEqual({ q: eq.quantity, a: eq.available, d: eq.damaged }, { q: 5, a: 4, d: 1 });

  res = await api('GET', `/maintenance?equipment=${ids.equipment}`, { token: tokens.admin });
  assert.equal(res.body.items.length, 1);
  const reportId = res.body.items[0]._id;
  assert.equal(res.body.items[0].status, 'reported');

  // Repair succeeds: the unit goes back on the shelf.
  res = await api('PATCH', `/maintenance/${reportId}`, { token: tokens.admin, body: { status: 'in_progress' } });
  assert.equal(res.status, 200);
  res = await api('PATCH', `/maintenance/${reportId}`, { token: tokens.admin, body: { status: 'resolved', note: 'Replaced port' } });
  assert.equal(res.status, 200);
  eq = await Equipment.findById(ids.equipment);
  assert.deepEqual({ q: eq.quantity, a: eq.available, d: eq.damaged }, { q: 5, a: 5, d: 0 });
  // Closed reports are final.
  assert.equal((await api('PATCH', `/maintenance/${reportId}`, { token: tokens.admin, body: { status: 'reported' } })).status, 409);

  // Students can file reports, but not manage them.
  res = await api('POST', '/maintenance', { token: tokens.student, body: { equipment: ids.equipment, title: 'Loose pin', description: 'Header pin is loose', severity: 'low' } });
  assert.equal(res.status, 201);
  assert.equal((await api('PATCH', `/maintenance/${res.body.report._id}`, { token: tokens.student, body: { status: 'resolved' } })).status, 403);
});

test('borrowing: cancellation releases stock; overdue detection blocks new requests', async () => {
  const today = new Date().toISOString();
  const due = new Date(Date.now() + 2 * 86400000).toISOString();
  const request = { equipment: ids.equipment, quantity: 1, purpose: 'Testing overdue flow', borrowDate: today, dueDate: due };

  let res = await api('POST', '/borrowings', { token: tokens.lecturer, body: request });
  const cancelId = res.body.borrowing._id;
  await api('PATCH', `/borrowings/${cancelId}/review`, { token: tokens.admin, body: { status: 'approved' } });
  assert.equal((await Equipment.findById(ids.equipment)).available, 4);
  res = await api('PATCH', `/borrowings/${cancelId}/cancel`, { token: tokens.lecturer });
  assert.equal(res.status, 200);
  assert.equal((await Equipment.findById(ids.equipment)).available, 5);

  res = await api('POST', '/borrowings', { token: tokens.student, body: request });
  const id = res.body.borrowing._id;
  await api('PATCH', `/borrowings/${id}/review`, { token: tokens.admin, body: { status: 'approved' } });
  await api('PATCH', `/borrowings/${id}/collect`, { token: tokens.admin });
  await Borrowing.updateOne({ _id: id }, { dueDate: new Date(Date.now() - 3 * 86400000) });

  const result = await runScheduledJobs();
  assert.equal(result.overdue, 1);
  assert.equal((await Borrowing.findById(id)).status, 'overdue');

  res = await api('GET', '/notifications', { token: tokens.student });
  assert.ok(res.body.items.some((n) => n.title === 'Equipment overdue'));

  res = await api('POST', '/borrowings', { token: tokens.student, body: request });
  assert.equal(res.status, 403, 'overdue users cannot borrow more');

  res = await api('PATCH', `/borrowings/${id}/return`, { token: tokens.admin, body: {} });
  assert.equal(res.body.borrowing.status, 'returned');
  assert.equal((await Equipment.findById(ids.equipment)).available, 5);
});

test('analytics: dashboard, reports and safe CSV export', async () => {
  let res = await api('GET', '/analytics/dashboard', { token: tokens.admin });
  assert.equal(res.status, 200);
  assert.ok(res.body.stats.laboratories >= 1);
  assert.ok(res.body.stats.totalUnits >= 5);
  assert.ok(res.body.recentActivity.length > 0);

  res = await api('GET', '/analytics/dashboard', { token: tokens.student });
  assert.equal(res.status, 200);

  res = await api('GET', '/analytics/reports', { token: tokens.admin });
  assert.equal(res.status, 200);
  assert.ok(res.body.equipmentUtilization.length >= 1);
  assert.equal((await api('GET', '/analytics/reports', { token: tokens.student })).status, 403);

  const csv = await fetch(`${base}/api/analytics/reports/export/borrowings`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type'), /text\/csv/);
  assert.equal((await api('GET', '/analytics/reports/export/borrowings', { token: tokens.lecturer })).status, 403);

  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
});

test('security: operator injection and mass assignment are neutralised', async () => {
  let res = await api('POST', '/auth/login', { body: { email: { $gt: '' }, password: { $gt: '' } } });
  assert.equal(res.status, 400);

  res = await api('PATCH', '/auth/me', { token: tokens.student, body: { name: 'Renamed', role: 'admin' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.role, 'student');
});
