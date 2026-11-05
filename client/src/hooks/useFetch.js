import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../services/api.js';
import { getSocket, POLL_INTERVAL_MS, realtimeEnabled } from '../services/socket.js';

/**
 * Fetches `url` (re-fetching when `params` change) and refreshes automatically when the server reports
 * that any of the given `watch` resources changed over Socket.IO.
 */
export function useFetch(url, { params, watch = [], enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const paramsKey = JSON.stringify(params || {});
  const requestId = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled || !url) return;
      const id = ++requestId.current;
      if (!silent) setLoading(true);
      try {
        const res = await api.get(url, { params: JSON.parse(paramsKey) });
        if (id !== requestId.current) return; // a newer request superseded this one
        setData(res.data);
        setError('');
      } catch (err) {
        if (id === requestId.current) setError(errorMessage(err));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [url, paramsKey, enabled]
  );

  useEffect(() => {
    load();
  }, [load]);

  const watchKey = watch.join(',');
  useEffect(() => {
    if (!watchKey) return undefined;
    if (!realtimeEnabled) {
      // No socket available: refresh quietly while the tab is visible.
      const timer = setInterval(() => document.visibilityState === 'visible' && load({ silent: true }), POLL_INTERVAL_MS);
      return () => clearInterval(timer);
    }
    const socket = getSocket();
    if (!socket) return undefined;
    const resources = watchKey.split(',');
    const onChange = (evt) => resources.includes(evt.resource) && load({ silent: true });
    socket.on('data:changed', onChange);
    return () => socket.off('data:changed', onChange);
  }, [watchKey, load]);

  return { data, loading, error, reload: load, setData };
}
