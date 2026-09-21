import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Declared rather than pulling in @types/node for one lookup.
declare const process: { env: Record<string, string | undefined> };

/**
 * GitHub Pages serves a project site from a subpath, so every asset URL and
 * the service worker's scope have to carry it. The deploy workflow sets
 * VITE_BASE from the repository name; the default matches the demireads repo,
 * so a local production build behaves the same as the deployed one.
 */
const base = process.env.VITE_BASE ?? '/demireads/';

export default defineConfig({
  base,
  plugins: [
    react(),
    /**
     * Installable, and fully offline after the first load (rule 2). Everything
     * the app needs is precached: code, styles, the self-hosted fonts and the
     * default illustrations. There is no runtime caching because there are no
     * runtime requests to cache.
     */
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // The plugin precaches manifest.icons by itself, so globPatterns below
      // leaves .png alone; listing an icon in both puts a duplicate entry in
      // the precache manifest. These two are not manifest icons, so they are
      // named here instead.
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: "Sebastian's ABC",
        short_name: 'ABC',
        description: 'Letters and numbers for Sebastian.',
        lang: 'en',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#FBF6EC',
        theme_color: '#FBF6EC',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
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
