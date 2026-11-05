import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { tokenStore } from '../services/api.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    disconnectSocket();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let active = true;
    api
      .get('/auth/me')
      .then((res) => {
        if (!active) return;
        setUser(res.data.user);
        connectSocket();
      })
      .catch(() => active && tokenStore.clear())
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const authenticate = useCallback(async (path, payload) => {
    const res = await api.post(path, payload);
    tokenStore.set(res.data.token);
    setUser(res.data.user);
    connectSocket();
    return res.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      isLecturer: user?.role === 'lecturer',
      isAssistant: user?.role === 'assistant',
      // Admins and lab assistants run the counter: review requests, check out and process returns.
      isStaff: user?.role === 'admin' || user?.role === 'assistant',
      login: (email, password) => authenticate('/auth/login', { email, password }),
      register: (payload) => authenticate('/auth/register', payload),
      logout,
      setUser,
    }),
    [user, loading, authenticate, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
