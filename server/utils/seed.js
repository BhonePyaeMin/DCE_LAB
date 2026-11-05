import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Laboratory from '../models/Laboratory.js';
import Equipment from '../models/Equipment.js';
import Reservation from '../models/Reservation.js';
import Borrowing from '../models/Borrowing.js';
import Counter from '../models/Counter.js';

export const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'DceLab@2025';

export const DEMO_ACCOUNTS = [
  { name: 'Lab Administrator', email: 'admin@dcelab.test', role: 'admin', identifier: 'STAFF-001', department: 'Digital and Communication Engineering' },
  { name: 'Dr. Napat Chaiwong', email: 'lecturer@dcelab.test', role: 'lecturer', identifier: 'STAFF-102', department: 'Digital and Communication Engineering' },
  { name: 'Mali Suksan', email: 'student@dcelab.test', role: 'student', identifier: '6531501001', department: 'Digital and Communication Engineering' },
  { name: 'Arthit Prasert', email: 'student2@dcelab.test', role: 'student', identifier: '6531501002', department: 'Digital and Communication Engineering' },
];

const LABS = [
  { name: 'Embedded Systems Lab', code: 'DCE-101', location: 'Building E, Room 101', capacity: 30, facilities: ['Oscilloscopes', 'Soldering stations', 'Arduino kits', 'Projector'], description: 'Microcontroller and embedded hardware practice.' },
  { name: 'Networking Lab', code: 'DCE-102', location: 'Building E, Room 102', capacity: 36, facilities: ['Cisco switches', 'Routers', 'Patch panels', 'Whiteboard'], description: 'Routing, switching and network security exercises.' },
  { name: 'Multimedia Studio', code: 'DCE-201', location: 'Building E, Room 201', capacity: 20, facilities: ['Camera rigs', 'Lighting kit', 'Editing workstations'], description: 'Photography, video production and post-production.' },
  { name: 'VR and AR Lab', code: 'DCE-202', location: 'Building E, Room 202', capacity: 16, facilities: ['VR headsets', 'Motion tracking', 'Gaming PCs'], description: 'Immersive technology development and testing.' },
  { name: 'Computer Lab A', code: 'DCE-301', location: 'Building E, Room 301', capacity: 45, facilities: ['45 workstations', 'Projector', 'Air conditioning'], description: 'General purpose programming and software classes.' },
];

const EQUIPMENT = [
  { name: 'Dell Latitude 5440 Laptop', category: 'Computers and Laptops', brand: 'Dell', model: 'Latitude 5440', quantity: 10, location: 'Cabinet A1', maxBorrowDays: 7 },
  { name: 'Raspberry Pi 5 Kit', category: 'Computers and Laptops', brand: 'Raspberry Pi', model: 'Pi 5 8GB', quantity: 8, location: 'Cabinet A2', maxBorrowDays: 14 },
  { name: 'Arduino Uno R3', category: 'Arduino and ESP32', brand: 'Arduino', model: 'Uno R3', quantity: 25, location: 'Cabinet B1', maxBorrowDays: 14 },
  { name: 'ESP32 DevKit V1', category: 'Arduino and ESP32', brand: 'Espressif', model: 'DevKit V1', quantity: 20, location: 'Cabinet B1', maxBorrowDays: 14 },
  { name: 'Cisco Catalyst 2960 Switch', category: 'Networking Equipment', brand: 'Cisco', model: 'Catalyst 2960', quantity: 6, location: 'Rack N1', maxBorrowDays: 3 },
  { name: 'TP-Link Wireless Router', category: 'Networking Equipment', brand: 'TP-Link', model: 'Archer AX55', quantity: 5, location: 'Rack N2', maxBorrowDays: 7 },
  { name: 'Canon EOS R50 Camera', category: 'Cameras and Photography', brand: 'Canon', model: 'EOS R50', quantity: 4, location: 'Cabinet C1', maxBorrowDays: 3, condition: 'good' },
  { name: 'Manfrotto Tripod', category: 'Cameras and Photography', brand: 'Manfrotto', model: 'Compact Action', quantity: 6, location: 'Cabinet C1', maxBorrowDays: 3 },
  { name: 'Meta Quest 3 Headset', category: 'VR and AR Devices', brand: 'Meta', model: 'Quest 3', quantity: 5, location: 'Cabinet D1', maxBorrowDays: 3 },
  { name: 'HoloLens 2', category: 'VR and AR Devices', brand: 'Microsoft', model: 'HoloLens 2', quantity: 2, location: 'Cabinet D2', maxBorrowDays: 2, condition: 'fair' },
  { name: 'DHT22 Temperature Sensor', category: 'Sensors and Electronic Components', brand: 'Aosong', model: 'DHT22', quantity: 40, location: 'Drawer S1', maxBorrowDays: 14 },
  { name: 'HC-SR04 Ultrasonic Sensor', category: 'Sensors and Electronic Components', brand: 'Generic', model: 'HC-SR04', quantity: 30, location: 'Drawer S2', maxBorrowDays: 14 },
  { name: 'Digital Multimeter', category: 'Laboratory Tools', brand: 'Fluke', model: '117', quantity: 12, location: 'Cabinet T1', maxBorrowDays: 5 },
  { name: 'Soldering Station', category: 'Laboratory Tools', brand: 'Hakko', model: 'FX-888D', quantity: 8, location: 'Cabinet T2', maxBorrowDays: 5, condition: 'poor' },
];

const DAY = 24 * 60 * 60 * 1000;

/** Inserts demo users, laboratories, equipment and a few sample transactions. */
export async function seedDatabase() {
  const users = {};
  for (const account of DEMO_ACCOUNTS) {
    users[account.role === 'student' ? account.email : account.role] = await User.create({ ...account, password: DEMO_PASSWORD });
  }
  const labs = await Laboratory.insertMany(LABS);
  const equipment = [];
  for (const item of EQUIPMENT) equipment.push(await Equipment.create({ ...item, available: item.quantity }));

  // Sample reservations: one approved tomorrow at 10:00 lab time, one pending the day after.
  const offsetMs = env.LAB_UTC_OFFSET_MINUTES * 60 * 1000;
  const labMidnightToday = Math.floor((Date.now() + offsetMs) / DAY) * DAY - offsetMs;
  const at = (days, hour) => new Date(labMidnightToday + days * DAY + hour * 60 * 60 * 1000);
  await Reservation.create([
    { user: users.lecturer._id, laboratory: labs[0]._id, startTime: at(1, 10), endTime: at(1, 12), purpose: 'Embedded systems practical - week 8', attendees: 24, status: 'approved', reviewedBy: users.admin._id, reviewedAt: new Date() },
    { user: users['student@dcelab.test']._id, laboratory: labs[4]._id, startTime: at(2, 13), endTime: at(2, 15), purpose: 'Capstone project team meeting', attendees: 5 },
  ]);

  // Sample borrowing: an approved request reserves stock exactly like the real workflow does.
  const arduino = equipment[2];
  await Borrowing.create({ user: users['student@dcelab.test']._id, equipment: arduino._id, quantity: 2, purpose: 'IoT mini project', borrowDate: new Date(), dueDate: new Date(Date.now() + 7 * DAY), status: 'approved', reviewedBy: users.admin._id, reviewedAt: new Date() });
  await Equipment.updateOne({ _id: arduino._id }, { $inc: { available: -2 } });
  await Borrowing.create({ user: users['student2@dcelab.test']._id, equipment: equipment[0]._id, quantity: 1, purpose: 'Group assignment', borrowDate: new Date(), dueDate: new Date(Date.now() + 5 * DAY) });

  console.log(`[seed] created ${DEMO_ACCOUNTS.length} users, ${labs.length} laboratories, ${equipment.length} equipment items`);
}

// Run directly: `npm run seed` resets and reseeds the configured database.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (env.isProd) {
    console.error('Refusing to seed a production database.');
    process.exit(1);
  }
  await connectDB();
  if (env.MONGODB_URI) {
    await mongoose.connection.dropDatabase();
  } else {
    await Promise.all([User, Laboratory, Equipment, Reservation, Borrowing, Counter].map((m) => m.deleteMany({})));
  }
  await seedDatabase();
  console.log('[seed] demo accounts (password from SEED_PASSWORD or the default in server/utils/seed.js):');
  DEMO_ACCOUNTS.forEach((a) => console.log(`  ${a.role.padEnd(8)} ${a.email}`));
  await disconnectDB();
  process.exit(0);
}
