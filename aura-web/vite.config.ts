import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['aura-icon.svg'],
      manifest: {
        name: 'AURA Music · Visual Diary',
        short_name: 'AURA Music',
        description: '把照片和喜欢的歌变成视觉记忆卡片',
        theme_color: '#fffaf2',
        background_color: '#fffaf2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [{ src: '/aura-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [{
          urlPattern: /\/api\/v2\/aura\/catalog$/,
          handler: 'NetworkFirst',
          options: { cacheName: 'aura-catalog', networkTimeoutSeconds: 4, expiration: { maxEntries: 2, maxAgeSeconds: 86400 } }
        }]
      }
    })
  ],
  server: {
    port: 5174,
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } }
  },
  test: { environment: 'node' }
})
