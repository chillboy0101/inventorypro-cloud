import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'framer-motion',
            '@supabase/supabase-js'
          ],
          ui: [
            '@headlessui/react',
            '@heroicons/react'
          ],
          charts: [
            'chart.js',
            'react-chartjs-2',
            'chartjs-adapter-date-fns',
            'date-fns'
          ]
        }
      }
    }
  },
}); 