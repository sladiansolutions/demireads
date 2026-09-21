import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Emit the illustration SVGs as files instead of inlining them as data
    // URIs. Keeps the JS bundle small and lets the service worker precache
    // and cache-bust each picture on its own.
    assetsInlineLimit: 0,
  },
  test: {
    // engine/ is pure TypeScript, so the default node environment is enough.
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
