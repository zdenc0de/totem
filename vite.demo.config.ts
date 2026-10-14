// Demo web del tótem para que el cliente revise todo en su navegador (demo/README.md).
// Usa el renderer real; solo cambia window.totem por un simulador que guarda en el navegador.
import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: resolve('demo'),
  publicDir: resolve('demo/public'),
  resolve: {
    alias: {
      '@shared': resolve('src/shared'),
      '@renderer': resolve('src/renderer'),
      // export.ts y config.ts importan fs/path para escribir en disco; la demo solo usa sus
      // funciones puras (tabla, CSV, xlsx y QR), así que basta con sustitutos mínimos.
      fs: resolve('demo/shims/fs.ts'),
      path: resolve('demo/shims/path.ts')
    }
  },
  plugins: [react()],
  build: {
    outDir: resolve('demo/dist'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000
  }
})
