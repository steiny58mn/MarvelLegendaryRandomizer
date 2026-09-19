import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: 'localhost',
      port: 5173,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/legendary/cards': {
          target: process.env.VITE_API_URL || 'https://api.frostpointlabs.com',
          changeOrigin: true,
          secure: true,
        },
        '/api/cards': {
          target: process.env.VITE_API_URL || 'https://api.frostpointlabs.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api\/cards/, '/legendary/cards'),
        },
      },
    },
  };
});
