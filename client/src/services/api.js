import axios from 'axios';

const TOKEN_KEY = 'dce-lab-token';

export const API_URL = import.meta.env.VITE_API_URL || '/api';
// Origin that serves /uploads (the API origin when VITE_API_URL is absolute, otherwise the page origin).
export const ASSET_ORIGIN = /^https?:\/\//.test(API_URL) ? new URL(API_URL).origin : '';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/login') || error.config?.url?.startsWith('/auth/register');
    if (error.response?.status === 401 && !isAuthCall && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:logout'));
    }
    error.userMessage = error.response?.data?.message || (error.request ? 'Cannot reach the server. Please try again.' : error.message);
    return Promise.reject(error);
  }
);

export const errorMessage = (err) => err?.userMessage || err?.message || 'Something went wrong';

/** Resolves an uploaded image URL returned by the API. */
export const assetUrl = (path) => (!path ? '' : /^https?:\/\//.test(path) ? path : `${ASSET_ORIGIN}${path}`);

/** Builds a multipart body from a plain object, skipping empty values. */
export function toFormData(values, files = {}) {
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, value);
  });
  Object.entries(files).forEach(([key, file]) => {
    if (!file) return;
    if (Array.isArray(file)) file.forEach((f) => form.append(key, f));
    else form.append(key, file);
  });
  return form;
}

export default api;
