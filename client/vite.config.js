import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const target = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': target,
      '/uploads': target,
      '/assets': target,
      '/socket.io': { target, ws: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
});
