import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(frontendDirectory, '..');

export default defineConfig({
  root: repositoryRoot,
  envDir: repositoryRoot,
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  build: {
    outDir: path.join(frontendDirectory, 'dist'),
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30 },
            { name: 'map-vendor', test: /node_modules[\\/](leaflet|react-leaflet|@react-leaflet)[\\/]/, priority: 25 },
            { name: 'motion-vendor', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 20 },
            { name: 'icon-vendor', test: /node_modules[\\/]lucide-react[\\/]/, priority: 15 },
          ],
        },
      },
    },
  },
});
