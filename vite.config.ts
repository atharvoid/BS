import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173 },
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    // The `three` chunk (~920 kB, ~245 kB gzipped) is only fetched when a 3D
    // stage mounts, never on first paint, so the default 500 kB warning is
    // noise. Kept just above it so real growth still shows up.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (
              id.includes('three') ||
              id.includes('@react-three') ||
              id.includes('zustand') ||
              id.includes('suspend-react') ||
              id.includes('its-fine')
            ) {
              return 'three'
            }
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
              return 'react'
            }
          }
          return undefined
        },
      },
    },
  },
})
