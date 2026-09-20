import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const PORT = parseInt(process.env.VITE_PORT || '5173', 10);
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: PORT,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
});
