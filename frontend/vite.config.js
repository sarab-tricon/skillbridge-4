import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // This will fail if 5173 is busy, instead of auto-incrementing
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Use esbuild for faster, less blocking minification
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'es2015',
    // Chunk size warnings
    chunkSizeWarningLimit: 600,
  },
  // Optimize CSS
  css: {
    devSourcemap: false,
  },
  // Performance hints
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
