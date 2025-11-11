import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    strictPort: false, // ポートが使用中なら自動で次のポートを試す
    host: true,
    open: false,
  },
  preview: {
    port: 8080,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
