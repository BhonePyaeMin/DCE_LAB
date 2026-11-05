import http from 'node:http';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import { initSockets } from './sockets/index.js';
import { startScheduler } from './services/scheduler.js';
import User from './models/User.js';
import { seedDatabase } from './utils/seed.js';

async function start() {
  await connectDB();

  // A fresh development database gets demo data so the app is usable straight away.
  if (!env.isProd && (await User.estimatedDocumentCount()) === 0) {
    await seedDatabase();
  }

  const server = http.createServer(app);
  initSockets(server);
  startScheduler();

  server.listen(env.PORT, () => console.log(`[server] DCE Lab API listening on http://localhost:${env.PORT}`));

  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
