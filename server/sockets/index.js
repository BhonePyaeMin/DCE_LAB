import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { userFromToken } from '../middleware/auth.js';

let io = null;

export function initSockets(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.CLIENT_ORIGINS, credentials: true } });

  io.use(async (socket, next) => {
    try {
      const user = await userFromToken(socket.handshake.auth?.token);
      socket.data.user = { id: String(user._id), role: user.role };
      next();
    } catch (err) {
      next(new Error(err.message || 'Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.data.user;
    socket.join(`user:${id}`);
    socket.join(`role:${role}`);
  });

  return io;
}

export const getIO = () => io;

/** Pushes an event to a single user's connected clients. */
export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

/** Tells every connected client that a resource changed so lists can refresh. */
export function broadcastChange(resource, action, id) {
  io?.emit('data:changed', { resource, action, id: id ? String(id) : undefined });
}
