import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true, // Listen on 0.0.0.0 so phone on local Wi-Fi can connect
    port: 5173
  },
  build: {
    target: 'es2020',
    sourcemap: true
  }
});
