// Política de red del tótem. Función pura (sin Electron) para poder probarla.
// En producción solo se permite contenido local. En desarrollo se permite además
// el servidor de Vite (HTTP + WebSocket de HMR) y las DevTools.

export type NetPolicyOptions = {
  /** Origen del servidor de desarrollo, p. ej. "http://localhost:5173". Solo en dev. */
  devServerOrigin?: string
}

const ALWAYS_ALLOWED = new Set(['file:', 'app:', 'data:', 'blob:'])
const DEV_ONLY = new Set(['devtools:', 'chrome-extension:'])

export function isAllowedUrl(rawUrl: string, opts: NetPolicyOptions = {}): boolean {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return false
  }

  if (ALWAYS_ALLOWED.has(url.protocol)) return true
  if (!opts.devServerOrigin) return false

  if (DEV_ONLY.has(url.protocol)) return true

  const dev = new URL(opts.devServerOrigin)
  const sameHost = url.hostname === dev.hostname && url.port === dev.port
  if (url.protocol === dev.protocol && sameHost) return true
  if ((url.protocol === 'ws:' || url.protocol === 'wss:') && sameHost) return true
  return false
}
