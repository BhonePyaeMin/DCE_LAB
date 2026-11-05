// Creates (or updates) an administrator account. Credentials come from the environment so they never
// end up in the repository:
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME="..." [ADMIN_ID=...] npm run create-admin
// Several accounts can be given at once with ADMINS_JSON='[{"email":"","password":"","name":"","identifier":""}]'.
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

const accountSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().min(2),
  identifier: z.string().trim().optional(),
});

function readAccounts() {
  if (process.env.ADMINS_JSON) return z.array(accountSchema).parse(JSON.parse(process.env.ADMINS_JSON));
  return [accountSchema.parse({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: process.env.ADMIN_NAME, identifier: process.env.ADMIN_ID })];
}

export async function upsertAdmin({ email, password, name, identifier }) {
  const existing = await User.findOne({ email });
  if (existing) {
    Object.assign(existing, { name, role: 'admin', isActive: true, password, ...(identifier ? { identifier } : {}) });
    await existing.save();
    return 'updated';
  }
  await User.create({ email, password, name, role: 'admin', identifier, department: 'Digital and Communication Engineering' });
  return 'created';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const accounts = readAccounts();
    await connectDB();
    for (const account of accounts) console.log(`[admin] ${await upsertAdmin(account)}: ${account.email}`);
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[admin] failed:', err.message);
    process.exit(1);
  }
}
