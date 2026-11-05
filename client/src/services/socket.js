import { io } from 'socket.io-client';
import { ASSET_ORIGIN, tokenStore } from './api.js';

let socket = null;

export function connectSocket() {
  const token = tokenStore.get();
  if (!token) return null;
  if (socket) socket.disconnect();
  socket = io(ASSET_ORIGIN || undefined, { auth: { token }, transports: ['websocket', 'polling'] });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export const getSocket = () => socket;
