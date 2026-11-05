import { io } from 'socket.io-client';
import { ASSET_ORIGIN, tokenStore } from './api.js';

// Socket.IO needs a long-running server. Serverless hosts (Vercel) cannot keep sockets open, so real-time
// is on by default only in development; set VITE_REALTIME=true to force it on. Otherwise the app polls.
export const realtimeEnabled = import.meta.env.VITE_REALTIME ? import.meta.env.VITE_REALTIME === 'true' : import.meta.env.DEV;
export const POLL_INTERVAL_MS = 30000;

let socket = null;

export function connectSocket() {
  const token = tokenStore.get();
  if (!token || !realtimeEnabled) return null;
  if (socket) socket.disconnect();
  socket = io(ASSET_ORIGIN || undefined, { auth: { token }, transports: ['websocket', 'polling'] });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export const getSocket = () => socket;
