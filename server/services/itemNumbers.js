import Equipment from '../models/Equipment.js';
import { nextSequence } from '../models/Counter.js';

/** Gives equipment registered before Item IDs existed a numeric ID, oldest first. */
export async function ensureItemNumbers() {
  const missing = await Equipment.find({ itemNo: { $exists: false } }).sort({ createdAt: 1, _id: 1 }).select('_id');
  for (const { _id } of missing) {
    const itemNo = await nextSequence('equipment-itemNo');
    await Equipment.updateOne({ _id, itemNo: { $exists: false } }, { $set: { itemNo } });
  }
  return missing.length;
}
