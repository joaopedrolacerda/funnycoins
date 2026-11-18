import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Em desenvolvimento, o Vite repassa a API para o backend em Rust: sem CORS.
const api = process.env.API_URL ?? 'http://127.0.0.1:8080';

export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      '/v1': api,
      '/health': api,
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
