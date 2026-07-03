import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client talks to the Express API in development via a proxy so that
// fetch('/api/...') works identically in dev and production.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
