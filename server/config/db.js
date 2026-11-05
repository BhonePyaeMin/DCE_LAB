import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

/**
 * Connects to MongoDB. When MONGODB_URI is empty (development / test only) an embedded
 * MongoDB instance is started so the project runs without any external setup.
 */
export async function connectDB() {
  mongoose.set('strictQuery', true);
  let uri = env.MONGODB_URI;

  if (!uri) {
    if (env.isProd) throw new Error('MONGODB_URI is required in production.');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const options = {};
    if (!env.isTest) {
      const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.mongo-data');
      fs.mkdirSync(dir, { recursive: true });
      options.instance = { dbPath: dir, storageEngine: 'wiredTiger' };
    }
    memoryServer = await MongoMemoryServer.create(options);
    uri = memoryServer.getUri('dce-lab');
    console.log('[db] MONGODB_URI not set - using embedded development database');
  }

  await mongoose.connect(uri);
  console.log('[db] connected');
  return mongoose.connection;
}

export async function disconnectDB() {
  if (memoryServer) {
    // The embedded server is a standalone instance, which the library stops by killing the process
    // (on Windows that skips the final checkpoint and recent writes are lost). Ask it to shut down
    // cleanly first so development data survives restarts.
    try {
      await mongoose.connection.db.admin().command({ shutdown: 1, force: true, timeoutSecs: 5 });
    } catch {
      /* the connection drops as the server exits */
    }
  }
  await mongoose.disconnect().catch(() => {});
  if (memoryServer) {
    await memoryServer.stop().catch(() => {});
    memoryServer = null;
  }
}
