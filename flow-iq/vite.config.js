import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  plugins: [react(), geojsonPlugin()],
})
