import { app, BrowserWindow, ipcMain, Menu, powerSaveBlocker, session } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { IPC } from '@shared/ipc'
import { log } from './log'
import { autoRecuperar, bloquearAtajos, endurecerContenido, endurecerSesion } from './hardening'

const devServerUrl = !app.isPackaged ? process.env['ELECTRON_RENDERER_URL'] : undefined
const esDev = !app.isPackaged
// En desarrollo se trabaja en ventana normal; TOTEM_KIOSK=1 fuerza el modo kiosco.
const modoKiosco = app.isPackaged || process.env['TOTEM_KIOSK'] === '1'

let ventana: BrowserWindow | null = null
let salidaPermitida = false

// Sin conexiones en segundo plano de Chromium.
app.commandLine.appendSwitch('disable-background-networking')
app.commandLine.appendSwitch('disable-component-update')
app.commandLine.appendSwitch('disable-domain-reliability')
app.commandLine.appendSwitch('no-pings')
app.commandLine.appendSwitch('disable-pinch')
app.commandLine.appendSwitch('overscroll-history-navigation', '0')

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!ventana) return
    if (ventana.isMinimized()) ventana.restore()
    ventana.focus()
  })
  app.whenReady().then(iniciar)
}

function salir(): void {
  log.info('Salida solicitada')
  salidaPermitida = true
  app.quit()
}

function iniciar(): void {
  log.info('Inicio de la app', {
    version: app.getVersion(),
    electron: process.versions.electron,
    kiosco: modoKiosco
  })

  Menu.setApplicationMenu(null)
  endurecerSesion(session.defaultSession, { devServerOrigin: devServerUrl })
  app.on('web-contents-created', (_e, wc) => endurecerContenido(wc))

  powerSaveBlocker.start('prevent-display-sleep')

  // TODO Fase 4: exigir PIN de administrador antes de salir.
  ipcMain.handle(IPC.adminSalir, () => salir())

  crearVentana()
}

function crearVentana(): void {
  ventana = new BrowserWindow({
    ...(modoKiosco
      ? { kiosk: true, fullscreen: true }
      : { width: 540, height: 960, useContentSize: true }),
    frame: !modoKiosco,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    show: false,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: esDev,
      spellcheck: false,
      webviewTag: false,
      navigateOnDragDrop: false,
      disableBlinkFeatures: 'Auxclick'
    }
  })

  if (modoKiosco) ventana.setAlwaysOnTop(true, 'screen-saver')

  // Alt+F4 y cualquier otro intento de cerrar: solo se cierra desde el panel admin.
  ventana.on('close', (e) => {
    if (modoKiosco && !salidaPermitida) {
      e.preventDefault()
      log.warn('Intento de cierre bloqueado')
    }
  })
  ventana.on('closed', () => (ventana = null))
  ventana.once('ready-to-show', () => ventana?.show())

  bloquearAtajos(ventana, esDev, salir)
  autoRecuperar(ventana)

  if (devServerUrl) {
    ventana.loadURL(devServerUrl)
  } else {
    ventana.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.on('window-all-closed', () => app.quit())
app.on('will-quit', () => log.info('Cierre de la app'))
process.on('uncaughtException', (err) => log.error('Excepción no controlada en main', err))
