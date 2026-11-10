import { defineConfig } from 'vite';
export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: { host: '0.0.0.0', port: 5173, proxy: { '/api': 'http://localhost:3001', '/uploads': 'http://localhost:3001' } },
  build: { outDir: 'dist', emptyOutDir: true }
});
