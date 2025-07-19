import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});