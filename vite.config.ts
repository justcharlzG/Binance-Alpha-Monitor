import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // 输出目录
    sourcemap: false, // 生产环境关闭 sourcemap 以减小体积
    minify: 'esbuild',
  },
  server: {
    port: 3000,
  }
});