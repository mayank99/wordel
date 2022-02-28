import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png', 'icon-192-maskable.png', 'icon-512-maskable.png'],
      manifest: {
        name: 'wordel',
        short_name: 'wordel',
        description: 'A beautiful and accessible version of the simple word game we all know and love.',
        icons: [
          { src: 'favicon.ico', type: 'image/x-icon', sizes: '16x16 32x32' },
          { src: 'icon-192.png', type: 'image/png', sizes: '192x192' },
          { src: 'icon-512.png', type: 'image/png', sizes: '512x512' },
          { src: 'icon-192-maskable.png', type: 'image/png', sizes: '192x192', purpose: 'maskable' },
          { src: 'icon-512-maskable.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
        ],
        start_url: '/',
        display: 'standalone',
      },
    }),
  ],
});
