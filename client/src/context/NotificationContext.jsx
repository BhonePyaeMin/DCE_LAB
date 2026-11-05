import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api.js';
import { getSocket, POLL_INTERVAL_MS, realtimeEnabled } from '../services/socket.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const NotificationContext = createContext(null);

/** Keeps the notification list and unread count in sync, including real-time pushes. */
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const knownUnread = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/notifications', { params: { limit: 30 } });
      setItems(res.data.items);
      setUnread(res.data.unread);
      // When polling instead of using sockets, surface anything that arrived since the last check.
      if (!realtimeEnabled && knownUnread.current !== null && res.data.unread > knownUnread.current) {
        const newest = res.data.items.find((n) => !n.read);
        if (newest) toast.info(newest.message, newest.title);
      }
      knownUnread.current = res.data.unread;
    } catch {
      /* the bell simply stays empty if the request fails */
    }
  }, [toast]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnread(0);
      return undefined;
    }
    refresh();
    if (!realtimeEnabled) {
      const timer = setInterval(() => document.visibilityState === 'visible' && refresh(), POLL_INTERVAL_MS);
      return () => clearInterval(timer);
    }
    const socket = getSocket();
    if (!socket) return undefined;
    const onNew = (n) => {
      setItems((list) => [n, ...list].slice(0, 30));
      setUnread((c) => c + 1);
      toast.info(n.message, n.title);
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [user, refresh, toast]);

  const markRead = useCallback(async (id) => {
    setItems((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    await api.patch(`/notifications/${id}/read`).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await api.patch('/notifications/read-all').catch(() => {});
  }, []);

  const remove = useCallback(
    async (id) => {
      await api.delete(`/notifications/${id}`).catch(() => {});
      refresh();
    },
    [refresh]
  );

  const value = useMemo(() => ({ items, unread, refresh, markRead, markAllRead, remove }), [items, unread, refresh, markRead, markAllRead, remove]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
