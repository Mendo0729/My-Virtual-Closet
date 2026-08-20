import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/rembg': {
        target: 'http://background-removal:7000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rembg/, ''),
      },
    },
  },
})
