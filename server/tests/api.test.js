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

// Smallest valid PNG, used as an equipment photo.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iWgQ3QAAAABJRU5ErkJggg==', 'base64');

async function api(method, path, { token, body, form } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${base}/api${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, body: json };
}

function equipmentForm(fields, withImage = true) {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => form.append(k, String(v)));
  if (withImage) form.append('image', new Blob([PNG], { type: 'image/png' }), 'photo.png');
  return form;
}

before(async () => {
  await connectDB();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;

  for (const role of ['admin', 'lecturer', 'assistant']) {
    await User.create({ name: role, email: `${role}@t.test`, password: 'password123', role });
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

  // Self-registration can never create privileged accounts.
  for (const role of ['admin', 'assistant']) {
    res = await api('POST', '/auth/register', { body: { name: 'Evil', email: `evil-${role}@t.test`, password: 'password123', role } });
    assert.equal(res.status, 400, `${role} must not be self-registrable`);
  }

  res = await api('POST', '/auth/register', { body: { name: 'Dup', email: 'stu@t.test', password: 'password123' } });
  assert.equal(res.status, 409);

  res = await api('POST', '/auth/login', { body: { email: 'stu@t.test', password: 'wrong-password' } });
  assert.equal(res.status, 401);

  assert.equal((await api('GET', '/auth/me')).status, 401);
  assert.equal((await api('GET', '/users', { token: tokens.student })).status, 403);
  assert.equal((await api('GET', '/users', { token: tokens.assistant })).status, 403, 'assistants cannot manage users');
  assert.equal((await api('GET', '/users', { token: tokens.admin })).status, 200);

  // Only admins can create lab assistant accounts.
  res = await api('POST', '/users', { token: tokens.admin, body: { name: 'New Assistant', email: 'new-assistant@t.test', password: 'password123', role: 'assistant' } });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, 'assistant');
});

test('reservation feature has been removed', async () => {
  assert.equal((await api('GET', '/reservations', { token: tokens.admin })).status, 404);
});

test('laboratories: only admins manage them', async () => {
  const payload = { name: 'Test Lab', code: 'tl-1', capacity: 20, openTime: '08:00', closeTime: '18:00', facilities: ['Projector'] };
  assert.equal((await api('POST', '/laboratories', { token: tokens.student, body: payload })).status, 403);
  assert.equal((await api('POST', '/laboratories', { token: tokens.assistant, body: payload })).status, 403);
  const res = await api('POST', '/laboratories', { token: tokens.admin, body: payload });
  assert.equal(res.status, 201);
  assert.equal(res.body.lab.code, 'TL-1');
  assert.equal((await api('POST', '/laboratories', { token: tokens.admin, body: payload })).status, 409);
  assert.equal((await api('GET', '/laboratories/not-an-id', { token: tokens.admin })).status, 400);
  assert.equal((await api('DELETE', `/laboratories/${res.body.lab._id}`, { token: tokens.admin })).status, 200);
});

test('equipment: photo required, generated IDs, QR codes, admin-only inventory edits', async () => {
  const fields = { name: 'ESP32 Board', category: 'Arduino and ESP32', quantity: 5, available: 999, maxBorrowDays: 7 };

  let res = await api('POST', '/equipment', { token: tokens.admin, form: equipmentForm(fields, false) });
  assert.equal(res.status, 400, 'equipment cannot be registered without a photo');
  assert.match(res.body.message, /photo/i);

  assert.equal((await api('POST', '/equipment', { token: tokens.assistant, form: equipmentForm(fields) })).status, 403, 'assistants cannot register equipment');

  // A file that claims to be an image but is not one is rejected.
  const fake = new FormData();
  Object.entries(fields).forEach(([k, v]) => fake.append(k, String(v)));
  fake.append('image', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'x.png');
  assert.equal((await api('POST', '/equipment', { token: tokens.admin, form: fake })).status, 400);

  res = await api('POST', '/equipment', { token: tokens.admin, form: equipmentForm(fields) });
  assert.equal(res.status, 201);
  assert.match(res.body.equipment.equipmentId, /^EQ-MCU-\d{4}$/);
  assert.equal(res.body.equipment.available, 5, 'client cannot set available stock');
  assert.ok(res.body.equipment.image, 'image URL is stored');
  ids.equipment = res.body.equipment._id;
  const code = res.body.equipment.equipmentId;

  res = await api('GET', `/equipment/${ids.equipment}/qr`, { token: tokens.admin });
  assert.ok(res.body.dataUrl.startsWith('data:image/png;base64,'));
  assert.ok(res.body.url.endsWith(`/scan/${res.body.itemNo}`), 'QR links to the numeric Item ID');

  res = await api('GET', `/equipment/code/${code}`, { token: tokens.student });
  assert.equal(res.status, 200);
  assert.equal(res.body.equipment.name, 'ESP32 Board');
});

const today = () => new Date().toISOString();
const inDays = (d) => new Date(Date.now() + d * 86400000).toISOString();
const request = (extra) => ({ equipment: ids.equipment, quantity: 2, purpose: 'Sensor project', borrowDate: today(), dueDate: inDays(3), ...extra });

test('borrowing: lifecycle, counter permissions and stock accounting through maintenance', async () => {
  assert.equal((await api('POST', '/borrowings', { token: tokens.student, body: request({ quantity: 6 }) })).status, 409);
  assert.equal((await api('POST', '/borrowings', { token: tokens.student, body: request({ dueDate: inDays(30) }) })).status, 400);
  assert.equal((await api('POST', '/borrowings', { token: tokens.student, body: request({ dueDate: inDays(-1) }) })).status, 400);

  let res = await api('POST', '/borrowings', { token: tokens.student, body: request() });
  assert.equal(res.status, 201);
  ids.borrowing = res.body.borrowing._id;

  // Lecturers and students cannot review; approval reserves stock.
  assert.equal((await api('PATCH', `/borrowings/${ids.borrowing}/review`, { token: tokens.lecturer, body: { status: 'approved' } })).status, 403);
  assert.equal((await api('PATCH', `/borrowings/${ids.borrowing}/review`, { token: tokens.student, body: { status: 'approved' } })).status, 403);
  // The lab assistant runs the counter.
  res = await api('PATCH', `/borrowings/${ids.borrowing}/review`, { token: tokens.assistant, body: { status: 'approved' } });
  assert.equal(res.status, 200);
  assert.equal((await Equipment.findById(ids.equipment)).available, 3);
  assert.equal((await api('PATCH', `/borrowings/${ids.borrowing}/review`, { token: tokens.admin, body: { status: 'approved' } })).status, 409, 'cannot approve twice');
  assert.equal((await api('PATCH', `/borrowings/${ids.borrowing}/return`, { token: tokens.assistant, body: {} })).status, 409, 'cannot return before collection');

  res = await api('PATCH', `/borrowings/${ids.borrowing}/collect`, { token: tokens.assistant });
  assert.equal(res.body.borrowing.status, 'borrowed');

  res = await api('PATCH', `/borrowings/${ids.borrowing}/return`, { token: tokens.assistant, body: { damagedQuantity: 1, note: 'Cracked USB port' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.borrowing.status, 'damaged');
  let eq = await Equipment.findById(ids.equipment);
  assert.deepEqual({ q: eq.quantity, a: eq.available, d: eq.damaged }, { q: 5, a: 4, d: 1 });

  res = await api('GET', `/maintenance?equipment=${ids.equipment}`, { token: tokens.assistant });
  assert.equal(res.body.items.length, 1);
  const reportId = res.body.items[0]._id;

  assert.equal((await api('PATCH', `/maintenance/${reportId}`, { token: tokens.student, body: { status: 'resolved' } })).status, 403);
  assert.equal((await api('PATCH', `/maintenance/${reportId}`, { token: tokens.assistant, body: { status: 'in_progress' } })).status, 200);
  assert.equal((await api('PATCH', `/maintenance/${reportId}`, { token: tokens.assistant, body: { status: 'resolved', note: 'Replaced port' } })).status, 200);
  eq = await Equipment.findById(ids.equipment);
  assert.deepEqual({ q: eq.quantity, a: eq.available, d: eq.damaged }, { q: 5, a: 5, d: 0 });
  assert.equal((await api('PATCH', `/maintenance/${reportId}`, { token: tokens.admin, body: { status: 'reported' } })).status, 409, 'closed reports are final');

  res = await api('POST', '/maintenance', { token: tokens.student, body: { equipment: ids.equipment, title: 'Loose pin', description: 'Header pin is loose', severity: 'low' } });
  assert.equal(res.status, 201);
});

test('calendar: shows pick-ups and returns, scoped by role', async () => {
  // A pending request by the student and an approved one by the lecturer.
  let res = await api('POST', '/borrowings', { token: tokens.student, body: request({ quantity: 1, purpose: 'Calendar test student' }) });
  assert.equal(res.status, 201);
  res = await api('POST', '/borrowings', { token: tokens.lecturer, body: request({ quantity: 1, purpose: 'Calendar test lecturer' }) });
  const lecturerBorrowing = res.body.borrowing._id;

  const range = `from=${new Date(Date.now() - 86400000).toISOString()}&to=${new Date(Date.now() + 10 * 86400000).toISOString()}`;
  res = await api('GET', `/borrowings/calendar?${range}`, { token: tokens.student });
  assert.equal(res.status, 200);
  assert.ok(res.body.items.length >= 2, 'pick-up and return events');
  assert.ok(res.body.items.every((e) => e.mine), 'students only see their own items');
  const types = new Set(res.body.items.map((e) => e.type));
  assert.ok(types.has('pickup') && types.has('return'));
  assert.ok(types.has('returned'), 'earlier returns appear on the day they were processed');

  res = await api('GET', `/borrowings/calendar?${range}`, { token: tokens.assistant });
  assert.ok(res.body.items.some((e) => !e.mine), 'staff see everybody');

  assert.equal((await api('GET', `/borrowings/calendar?from=${new Date().toISOString()}&to=${new Date(Date.now() + 200 * 86400000).toISOString()}`, { token: tokens.admin })).status, 400);

  await api('PATCH', `/borrowings/${lecturerBorrowing}/cancel`, { token: tokens.lecturer });
});

test('borrowing: cancellation releases stock; overdue detection blocks new requests', async () => {
  let res = await api('POST', '/borrowings', { token: tokens.lecturer, body: request({ quantity: 1 }) });
  const cancelId = res.body.borrowing._id;
  const before = (await Equipment.findById(ids.equipment)).available;
  await api('PATCH', `/borrowings/${cancelId}/review`, { token: tokens.admin, body: { status: 'approved' } });
  assert.equal((await Equipment.findById(ids.equipment)).available, before - 1);
  res = await api('PATCH', `/borrowings/${cancelId}/cancel`, { token: tokens.lecturer });
  assert.equal(res.status, 200);
  assert.equal((await Equipment.findById(ids.equipment)).available, before);

  const studentId = (await User.findOne({ email: 'stu@t.test' }))._id;
  await Borrowing.deleteMany({ user: studentId, status: 'pending' });
  res = await api('POST', '/borrowings', { token: tokens.student, body: request({ quantity: 1 }) });
  const id = res.body.borrowing._id;
  await api('PATCH', `/borrowings/${id}/review`, { token: tokens.admin, body: { status: 'approved' } });
  await api('PATCH', `/borrowings/${id}/collect`, { token: tokens.admin });
  await Borrowing.updateOne({ _id: id }, { dueDate: new Date(Date.now() - 3 * 86400000) });

  const result = await runScheduledJobs();
  assert.equal(result.overdue, 1);
  assert.equal((await Borrowing.findById(id)).status, 'overdue');

  res = await api('GET', '/notifications', { token: tokens.student });
  assert.ok(res.body.items.some((n) => n.title === 'Equipment overdue'));
  res = await api('GET', '/notifications', { token: tokens.assistant });
  assert.ok(res.body.items.some((n) => n.title === 'Overdue equipment'), 'assistants are alerted to overdue items');

  assert.equal((await api('POST', '/borrowings', { token: tokens.student, body: request({ quantity: 1 }) })).status, 403, 'overdue users cannot borrow more');

  res = await api('PATCH', `/borrowings/${id}/return`, { token: tokens.assistant, body: {} });
  assert.equal(res.body.borrowing.status, 'returned');
});

test('analytics: dashboard, reports and safe CSV export', async () => {
  let res = await api('GET', '/analytics/dashboard', { token: tokens.admin });
  assert.equal(res.status, 200);
  assert.ok(res.body.stats.totalUnits >= 5);
  assert.ok(res.body.recentActivity.length > 0);
  assert.ok(Array.isArray(res.body.upcomingItems));

  for (const role of ['student', 'lecturer', 'assistant']) {
    assert.equal((await api('GET', '/analytics/dashboard', { token: tokens[role] })).status, 200);
  }

  res = await api('GET', '/analytics/reports', { token: tokens.assistant });
  assert.equal(res.status, 200);
  assert.ok(res.body.equipmentUtilization.length >= 1);
  assert.ok(res.body.categoryBreakdown.length >= 1);
  assert.equal((await api('GET', '/analytics/reports', { token: tokens.student })).status, 403);

  const csv = await fetch(`${base}/api/analytics/reports/export/borrowings`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type'), /text\/csv/);
  assert.equal((await api('GET', '/analytics/reports/export/borrowings', { token: tokens.assistant })).status, 403);

  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
});

test('security: operator injection and mass assignment are neutralised', async () => {
  let res = await api('POST', '/auth/login', { body: { email: { $gt: '' }, password: { $gt: '' } } });
  assert.equal(res.status, 400);

  res = await api('PATCH', '/auth/me', { token: tokens.student, body: { name: 'Renamed', role: 'admin' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.role, 'student');
});

test('production storage: images are kept in MongoDB and served by /api/files; cron is protected', async () => {
  const { env } = await import('../config/env.js');
  env.isProd = true; // exercise the serverless code path (no writable disk)
  try {
    const fields = { name: 'Stored Image Item', category: 'Laboratory Tools', quantity: 1 };
    const res = await api('POST', '/equipment', { token: tokens.admin, form: equipmentForm(fields) });
    assert.equal(res.status, 201);
    assert.match(res.body.equipment.image, /\/api\/files\/[0-9a-f]{24}$/);

    const file = await fetch(`${base}${res.body.equipment.image.replace(/^https?:\/\/[^/]+/, '')}`);
    assert.equal(file.status, 200);
    assert.equal(file.headers.get('content-type'), 'image/png');
    assert.equal(file.headers.get('x-content-type-options'), 'nosniff');
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), PNG);

    assert.equal((await fetch(`${base}/api/files/not-an-id`)).status, 400);
  } finally {
    env.isProd = false;
  }

  // Cron endpoint: disabled without a secret, rejects wrong secrets, runs with the right one.
  const { env: e2 } = await import('../config/env.js');
  assert.equal((await api('GET', '/cron/run')).status, 404);
  e2.CRON_SECRET = 'test-secret';
  try {
    assert.equal((await api('GET', '/cron/run', { token: 'wrong' })).status, 401);
    const ok = await fetch(`${base}/api/cron/run`, { headers: { Authorization: 'Bearer test-secret' } });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).success, true);
  } finally {
    e2.CRON_SECRET = '';
  }
});

test('counter: student lookup, item IDs, signed borrowing and receipt', async () => {
  const sig = `data:image/png;base64,${PNG.toString('base64')}`;
  const mk = async (name, quantity) => (await api('POST', '/equipment', { token: tokens.admin, form: equipmentForm({ name, category: 'Arduino and ESP32', quantity, maxBorrowDays: 3 }) })).body.equipment;
  const esp1 = await mk('ESP 001', 1);
  const esp2 = await mk('ESP 002', 1);
  assert.ok(Number.isInteger(esp1.itemNo) && esp2.itemNo === esp1.itemNo + 1, 'items get sequential numeric IDs');

  // A QR code resolves by numeric Item ID as well as the EQ- code.
  let res = await api('GET', `/equipment/code/${esp1.itemNo}`, { token: tokens.assistant });
  assert.equal(res.body.equipment.name, 'ESP 001');
  assert.ok((await api('GET', `/equipment/${esp1._id}/qr`, { token: tokens.admin })).body.url.endsWith(`/scan/${esp1.itemNo}`));

  // Step 1: students cannot use the counter; staff find the student by Student ID.
  assert.equal((await api('GET', '/borrowings/counter/students', { token: tokens.student })).status, 403);
  await User.updateOne({ email: 'stu@t.test' }, { identifier: '6531500777', department: 'DCE' });
  res = await api('GET', '/borrowings/counter/students?q=6531500777', { token: tokens.assistant });
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].eligible, true);
  const student = res.body.items[0];

  // Step 2: the item list shows ID, name and status.
  res = await api('GET', `/borrowings/counter/items?q=${esp2.itemNo}`, { token: tokens.assistant });
  assert.equal(res.body.items[0].name, 'ESP 002');
  assert.equal(res.body.items[0].status, 'available');

  // Steps 3 and 4 need both signatures.
  const body = { student: student._id, items: [{ equipment: esp1._id, quantity: 1 }, { equipment: esp2._id, quantity: 1 }], dueDate: inDays(2), purpose: 'Project', studentSignature: sig, assistantSignature: sig };
  assert.equal((await api('POST', '/borrowings/counter', { token: tokens.assistant, body: { ...body, assistantSignature: undefined } })).status, 400);
  assert.equal((await api('POST', '/borrowings/counter', { token: tokens.assistant, body: { ...body, studentSignature: 'data:image/png;base64,AAAA' } })).status, 400, 'signature must be a real PNG');
  assert.equal((await api('POST', '/borrowings/counter', { token: tokens.student, body })).status, 403);
  assert.equal((await api('POST', '/borrowings/counter', { token: tokens.assistant, body: { ...body, dueDate: inDays(10) } })).status, 400, 'respects max borrow days');

  res = await api('POST', '/borrowings/counter', { token: tokens.assistant, body });
  assert.equal(res.status, 201);
  const txn = res.body.transaction;
  assert.match(txn.code, /^BR-\d{5}$/);
  assert.equal(txn.items.length, 2);
  assert.equal(txn.assistant.name, 'assistant');

  // The items are now borrowed and no longer available.
  assert.equal((await Equipment.findById(esp1._id)).available, 0);
  res = await api('GET', `/borrowings/counter/items?q=ESP 001`, { token: tokens.assistant });
  assert.equal(res.body.items[0].status, 'borrowed');
  assert.equal((await api('POST', '/borrowings/counter', { token: tokens.assistant, body: { ...body, items: [body.items[0]] } })).status, 409, 'unavailable items are refused');
  const loans = await Borrowing.find({ transaction: txn._id });
  assert.deepEqual(loans.map((l) => l.status), ['borrowed', 'borrowed']);

  // Receipts are visible to staff and the student, nobody else.
  assert.equal((await api('GET', `/borrowings/transactions/${txn._id}`, { token: tokens.student })).body.transaction.studentSignature, sig);
  assert.equal((await api('GET', `/borrowings/transactions/${txn._id}`, { token: tokens.lecturer })).status, 404);
  assert.equal((await api('GET', `/borrowings/transactions/${txn._id}`, { token: tokens.admin })).status, 200);

  // Returning through the normal flow restores stock.
  assert.equal((await api('PATCH', `/borrowings/${loans[0]._id}/return`, { token: tokens.assistant, body: {} })).status, 200);
  assert.equal((await Equipment.findById(esp1._id)).available, 1);
});
