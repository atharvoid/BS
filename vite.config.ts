import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // The preview proxy reaches the dev server from a public host, so the
    // allowlist has to accept it. Kept open because the sandbox is ephemeral.
    allowedHosts: true,
    hmr: { clientPort: 443, protocol: 'wss' },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (
              id.includes('three') ||
              id.includes('@react-three') ||
              id.includes('tunnel-rat') ||
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
