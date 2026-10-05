// Endurecimiento de Electron para modo kiosco (CLAUDE.md §2 y §13).
import { BrowserWindow, Session, WebContents } from 'electron'
import { isAllowedUrl, NetPolicyOptions } from './net-policy'
import { log } from './log'

/** Bloquea toda request no local y niega todos los permisos de la sesión. */
export function endurecerSesion(ses: Session, policy: NetPolicyOptions): void {
  ses.webRequest.onBeforeRequest((details, callback) => {
    const permitido = isAllowedUrl(details.url, policy)
    if (!permitido) log.warn('Request bloqueada', { url: recortarUrl(details.url) })
    callback({ cancel: !permitido })
  })

  ses.setPermissionRequestHandler((_wc, permiso, callback) => {
    log.warn('Permiso negado', { permiso })
    callback(false)
  })
  ses.setPermissionCheckHandler(() => false)
  ses.setDevicePermissionHandler(() => false)

  // El corrector descarga diccionarios desde internet: apagarlo.
  ses.setSpellCheckerEnabled(false)
}

/** Bloquea navegación, ventanas nuevas, webviews y zoom en el contenido de la ventana. */
export function endurecerContenido(wc: WebContents): void {
  wc.on('will-navigate', (e, url) => {
    // Recargas a la misma página (p. ej. tras un crash) se permiten.
    if (url === wc.getURL()) return
    e.preventDefault()
    log.warn('Navegación bloqueada', { url: recortarUrl(url) })
  })
  wc.on('will-redirect', (e, url) => {
    e.preventDefault()
    log.warn('Redirección bloqueada', { url: recortarUrl(url) })
  })
  wc.on('will-attach-webview', (e) => e.preventDefault())
  wc.setWindowOpenHandler(() => ({ action: 'deny' }))

  wc.on('did-finish-load', () => {
    wc.setVisualZoomLevelLimits(1, 1).catch(() => {})
    wc.setZoomLevel(0)
  })
  wc.on('zoom-changed', () => wc.setZoomLevel(0))
}

/**
 * Bloquea atajos de teclado que permitirían salir, recargar o abrir herramientas.
 * En desarrollo deja F12 (DevTools), Ctrl+R (recargar) y Ctrl+Shift+Q (salir).
 */
export function bloquearAtajos(win: BrowserWindow, dev: boolean, salir: () => void): void {
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return

    if (dev) {
      const k = input.key.toLowerCase()
      if (input.key === 'F12') return win.webContents.toggleDevTools()
      if (input.control && !input.shift && k === 'r') return
      if (input.control && input.shift && k === 'q') return salir()
    }

    const esTeclaDeFuncion = /^F\d{1,2}$/.test(input.key)
    if (input.control || input.alt || input.meta || esTeclaDeFuncion || input.key === 'Escape') {
      e.preventDefault()
    }
  })
}

/** Recupera el renderer si se cae o se congela: recarga, y la app arranca en IDLE. */
export function autoRecuperar(win: BrowserWindow): void {
  const wc = win.webContents
  let congelado: NodeJS.Timeout | null = null

  wc.on('render-process-gone', (_e, details) => {
    log.error('Renderer caído; recargando', { reason: details.reason, exitCode: details.exitCode })
    setTimeout(() => !win.isDestroyed() && wc.reload(), 500)
  })

  win.on('unresponsive', () => {
    log.warn('Ventana sin respuesta')
    congelado ??= setTimeout(() => {
      congelado = null
      if (win.isDestroyed()) return
      log.error('Ventana congelada >8 s; forzando recarga')
      wc.forcefullyCrashRenderer()
      wc.reload()
    }, 8000)
  })
  win.on('responsive', () => {
    if (congelado) clearTimeout(congelado)
    congelado = null
  })
}

function recortarUrl(url: string): string {
  return url.length > 200 ? `${url.slice(0, 200)}…` : url
}
