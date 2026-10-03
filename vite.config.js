import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  build: {
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
