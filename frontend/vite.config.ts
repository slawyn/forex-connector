import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // Your backend server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    port: 80
  }, 
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src'],
      exclude: [],
    }
  },
  resolve: {
    alias: {
      src: "/src",
    },
  },
})
