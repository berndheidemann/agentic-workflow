import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy /api/ to PocketBase in development
      '/api': {
        target: 'http://pocketbase:8090',
        changeOrigin: true,
      },
      // Proxy /_/ to PocketBase Admin UI in development
      '/_': {
        target: 'http://pocketbase:8090',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
