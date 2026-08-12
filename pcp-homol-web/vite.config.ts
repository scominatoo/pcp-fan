import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api → API Nest — porta FIXA 3000 neste servidor
const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
  },
};

const allowedHosts = [
  'pcp.synnex.com.br',
  'localhost',
  '127.0.0.1',
  '10.103.38.3',
];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    strictPort: false,
    host: true,
    allowedHosts,
    proxy: apiProxy,
  },
  // Produção via systemd (vite preview) + nginx → Host: pcp.synnex.com.br
  preview: {
    port: 5175,
    strictPort: true,
    host: true,
    allowedHosts,
    proxy: apiProxy,
  },
});
