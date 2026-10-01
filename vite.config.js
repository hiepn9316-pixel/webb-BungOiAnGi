import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/bản copy tét/**', '**/node_modules/**']
    }
  }
});
