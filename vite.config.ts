import { jsxLocPlugin } from '@builder.io/vite-plugin-jsx-loc';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'path';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const plugins = [react(), tailwindcss(), jsxLocPlugin()];

export default defineConfig({
  plugins,
  cacheDir: path.resolve(__dirname, '.vite'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
  envDir: path.resolve(__dirname),
  root: path.resolve(__dirname, 'client'),
  publicDir: path.resolve(__dirname, 'client', 'public'),
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', '@tanstack/react-query'],
          'vendor-trpc': ['@trpc/client', '@trpc/react-query', 'superjson'],
          'vendor-charts': ['recharts'],
          'vendor-calendar': ['react-big-calendar', 'date-fns'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
        }
      }
    }
  },
  server: {
    host: true,
    allowedHosts: [
      '.manuspre.computer',
      '.manus.computer',
      '.manus-asia.computer',
      '.manuscomputer.ai',
      '.manusvm.computer',
      'localhost',
      '127.0.0.1',
    ],
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
  },
});
