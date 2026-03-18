import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Skip PWA in desktop (Electron) mode — service workers conflict with Electron
    ...(mode !== 'desktop' ? [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-v2.png'],
      manifest: {
        name: 'TindaPOS',
        short_name: 'TindaPOS',
        description: 'Ang POS para sa bawat tindahan.',
        theme_color: '#E8302A',
        background_color: '#FAFAF8',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/login',
        icons: [
          {
            src: 'logo-v2.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'logo-v2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't cache the .exe file
        globIgnores: ['**/*.exe'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      // Don't register PWA in desktop mode
      devOptions: {
        enabled: true
      }
    })] : [])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
