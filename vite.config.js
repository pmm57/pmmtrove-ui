import { fileURLToPath, URL } from 'node:url' 
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';
import fs from 'fs'
import vueDevTools from 'vite-plugin-vue-devtools'
const isRender = !!process.env.RENDER;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap')
    }
  },
  server: isRender
    ? {
        // Render: no HTTPS, no certs, no host override
        port: 5173,
        strictPort: true
      }
    : {
        // Local development
        host: '127.0.0.1', // force IPv4
        port: 5173,
        https: {
          key: fs.readFileSync(path.resolve(__dirname, '../certs/localhost-key.pem')),
          cert: fs.readFileSync(path.resolve(__dirname, '../certs/localhost.pem'))
        },
        strictPort: true
      }
})
