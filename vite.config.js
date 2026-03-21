import { fileURLToPath, URL } from 'node:url' 
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';
import fs from 'fs'
import os from 'os'
import vueDevTools from 'vite-plugin-vue-devtools'
const isRender = !!process.env.RENDER;
// mkcert certs stored in: C:\Users\<you>\certs (Windows) / ~\certs (macOS/Linux)
const certDir = path.join(os.homedir(), 'certs')

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
          key: fs.readFileSync(path.resolve(certDir, 'localhost+2-key.pem')),
          cert: fs.readFileSync(path.resolve(certDir, 'localhost+2.pem'))
        },
        strictPort: true
      },
  css: {
    preprocessorOptions: {
      scss: {
        // Silences deprecation warnings coming from dependencies (node_modules)
        quietDeps: true,
        // Optional: silence only specific warning categories
        // (useful when you still want to see other warnings)
        silenceDeprecations: ["import", "global-builtin", "color-functions"],
        // If you're on Vite 5.4+ you can opt into the modern compiler API
        // (helps with other Sass warnings/perf and avoids legacy API warnings)
        api: "modern-compiler",
      },
    },
  },

})
