import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid TS error when @types/node is missing
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    base: '/christmas/',
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
    preview: {
      host: '0.0.0.0',
      port: 8000,
      allowedHosts: ['all']
    },
    define: {
      // 仅注入 API_KEY，绝对不要覆盖整个 process.env 对象
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
    }
  };
});