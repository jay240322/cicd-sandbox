import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Forces Vite to listen to external network traffic in Kubernetes
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Forwards all /api requests straight to your backend container
        changeOrigin: true,
        secure: false,
      }
    }
  }
})