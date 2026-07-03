import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client talks to the Express API. In dev we proxy /api to :4000 so the
// frontend can be served from Vite with hot reload while sharing an origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // The project sub-apps are served by the Express server so the
      // "Visit project" links resolve in dev too. Without these, Vite's SPA
      // fallback would answer these paths with the portfolio home page.
      '/Corteza': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/Seta': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/LogiqAI': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/Talkly': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/Kinetik': {
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
