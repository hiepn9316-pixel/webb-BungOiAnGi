import { defineConfig } from 'vite';

const apiPort = Number(process.env.API_PORT || process.env.PORT || 3000);

export default defineConfig({
  server: {
    host: true,
    proxy: {
      '/api': `http://127.0.0.1:${apiPort}`,
      '/660': `http://127.0.0.1:${apiPort}`,
      '/register': `http://127.0.0.1:${apiPort}`,
      '/login': `http://127.0.0.1:${apiPort}`,
      '/health': `http://127.0.0.1:${apiPort}`
    },
    watch: {
      ignored: ['**/bản copy tét/**', '**/node_modules/**']
    }
  }
});
