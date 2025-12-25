import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    base: '/christmas/',
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Crucial for Docker
      port: 3000,
    },
    define: {
      // Shim process.env for the application code
      'process.env': process.env
    }
  };
});