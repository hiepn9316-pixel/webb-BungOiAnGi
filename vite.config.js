import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/660': 'http://127.0.0.1:3000',
      '/register': 'http://127.0.0.1:3000',
      '/login': 'http://127.0.0.1:3000',
      '/health': 'http://127.0.0.1:3000'
    },
    watch: {
      ignored: ['**/bản copy tét/**', '**/node_modules/**']
    }
  }
});
