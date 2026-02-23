import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteCompression({ algorithm: 'gzip', threshold: 1024 }),
    viteCompression({ algorithm: 'brotliCompress', threshold: 1024, ext: '.br' }),
    visualizer({ template: 'treemap', filename: 'bundle-analysis.html', open: false }) as any,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          if (id.includes('node_modules/gsap') || id.includes('node_modules/@gsap')) {
            return 'gsap-vendor';
          }
          if (id.includes('node_modules/motion')) {
            return 'motion-vendor';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/@dnd-kit')) {
            return 'dnd-vendor';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
