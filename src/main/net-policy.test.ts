import { describe, expect, it } from 'vitest'
import { isAllowedUrl } from './net-policy'

describe('isAllowedUrl — producción', () => {
  it.each([
    'file:///C:/Program%20Files/Totem/resources/app.asar/out/renderer/index.html',
    'app://bundle/index.js',
    'data:image/png;base64,iVBORw0KGgo=',
    'blob:file:///1234-5678'
  ])('permite contenido local: %s', (url) => {
    expect(isAllowedUrl(url)).toBe(true)
  })

  it.each([
    'https://fonts.googleapis.com/css2?family=Poppins',
    'https://cdn.jsdelivr.net/npm/react',
    'http://localhost:5173/',
    'ws://localhost:5173/',
    'https://www.google-analytics.com/collect',
    'http://192.168.1.10/',
    'devtools://devtools/bundled/inspector.html',
    'chrome-extension://abc/index.js',
    'ftp://example.com/file',
    'no es una url'
  ])('bloquea: %s', (url) => {
    expect(isAllowedUrl(url)).toBe(false)
  })
})

describe('isAllowedUrl — desarrollo', () => {
  const opts = { devServerOrigin: 'http://localhost:5173' }

  it('permite el servidor de Vite y su HMR', () => {
    expect(isAllowedUrl('http://localhost:5173/main.tsx', opts)).toBe(true)
    expect(isAllowedUrl('ws://localhost:5173/', opts)).toBe(true)
    expect(isAllowedUrl('devtools://devtools/bundled/inspector.html', opts)).toBe(true)
  })

  it('sigue bloqueando internet y otros puertos', () => {
    expect(isAllowedUrl('https://fonts.gstatic.com/s/poppins.woff2', opts)).toBe(false)
    expect(isAllowedUrl('http://localhost:3000/', opts)).toBe(false)
    expect(isAllowedUrl('http://example.com:5173/', opts)).toBe(false)
  })
})
