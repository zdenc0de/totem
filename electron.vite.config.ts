import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const shared = { '@shared': resolve('src/shared') }

export default defineConfig({
  main: {
    resolve: { alias: shared }
  },
  preload: {
    resolve: { alias: shared }
  },
  renderer: {
    root: resolve('src/renderer'),
    resolve: {
      alias: {
        ...shared,
        '@renderer': resolve('src/renderer')
      }
    },
    build: {
      // Los assets se incrustan o se sirven desde file://; nada externo.
      assetsInlineLimit: 0
    },
    plugins: [react()]
  }
})
