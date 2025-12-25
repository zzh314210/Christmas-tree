import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
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
    },
    define: {
      // 仅注入必要的环境变量，避免序列化整个 process.env 导致构建崩溃
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
      'process.env': '{}' // 提供一个空的兜底，防止代码中引用 process.env 报错
    }
  };
});