import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    // Porta obrigatória do frontend nesta homologação
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        // Deve bater com BACKEND_PORT do pcp-homol-api/.env (obrigatório: 3000)
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
