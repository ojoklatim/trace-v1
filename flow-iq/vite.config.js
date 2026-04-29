import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Custom plugin to import .geojson files as JSON modules
function geojsonPlugin() {
  return {
    name: 'vite-plugin-geojson',
    transform(code, id) {
      if (id.endsWith('.geojson')) {
        return {
          code: `export default ${code}`,
          map: null,
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(), 
    geojsonPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000, // Increase to 4MB for large Mapbox/DeckGL chunks
      },
      manifest: {
        name: 'TRACE Flood Intelligence',
        short_name: 'TRACE',
        description: 'Real-time flood risk intelligence for Bwaise, Kampala',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
