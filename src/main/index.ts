import { app, BrowserWindow, dialog, Menu, powerSaveBlocker, session } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { log } from './log'
import { autoRecuperar, bloquearAtajos, endurecerContenido, endurecerSesion } from './hardening'
import { cargarContenido, generarQrs } from './config'
import { crearStorage } from './storage'
import { crearSettings } from './settings'
import { registrarIpc } from './ipc'

const devServerUrl = !app.isPackaged ? process.env['ELECTRON_RENDERER_URL'] : undefined
const esDev = !app.isPackaged
// En desarrollo se trabaja en ventana normal; TOTEM_KIOSK=1 fuerza el modo kiosco.
const modoKiosco = app.isPackaged || process.env['TOTEM_KIOSK'] === '1'

let ventana: BrowserWindow | null = null
let salidaPermitida = false
let bloquearAdmin = (): void => {}

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
  app
    .whenReady()
    .then(iniciar)
    .catch((err) => {
      // Sin datos no se puede registrar a nadie: la ventana abre y el renderer muestra
      // "fuera de servicio" porque getConfig no responde.
      log.error('Fallo al iniciar', err)
      if (!ventana) crearVentana()
    })
}

function salir(): void {
  log.info('Salida solicitada')
  salidaPermitida = true
  app.quit()
}

async function iniciar(): Promise<void> {
  log.info('Inicio de la app', {
    version: app.getVersion(),
    electron: process.versions.electron,
    kiosco: modoKiosco
  })

  Menu.setApplicationMenu(null)
  endurecerSesion(session.defaultSession, { devServerOrigin: devServerUrl })
  app.on('web-contents-created', (_e, wc) => endurecerContenido(wc))

  powerSaveBlocker.start('prevent-display-sleep')

  const userData = app.getPath('userData')
  const dirData = join(userData, 'data')
  const cargado = cargarContenido([join(userData, 'content.json'), rutaContenidoEmpaquetado()], log)
  const ipc = registrarIpc({
    storage: crearStorage(dirData, log),
    settings: crearSettings(dirData, log),
    contenido: cargado.contenido,
    qr: await generarQrs(cargado, log),
    elegirCarpeta,
    salir
  })
  bloquearAdmin = ipc.bloquearAdmin

  // Arranque automático al iniciar sesión en Windows (§13). Solo en la app instalada.
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: true })

  crearVentana()
}

/**
 * Diálogo para elegir la USB. Se abre como hijo de la ventana kiosco para que quede encima.
 * Solo en desarrollo, TOTEM_EXPORT_DIR lo sustituye (pruebas automáticas).
 */
async function elegirCarpeta(): Promise<string | null> {
  const fija = process.env['TOTEM_EXPORT_DIR']
  if (esDev && fija) return fija
  if (!ventana) return null
  const r = await dialog.showOpenDialog(ventana, {
    title: 'Elige la USB donde guardar los registros',
    buttonLabel: 'Exportar aquí',
    properties: ['openDirectory', 'createDirectory']
  })
  return r.canceled ? null : (r.filePaths[0] ?? null)
}

/** content.json empaquetado como extraResources; en desarrollo, el de resources/. */
function rutaContenidoEmpaquetado(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'content.json')
    : join(app.getAppPath(), 'resources', 'content.json')
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
  // Cada carga (incluida la recarga tras un crash) vuelve a IDLE: el panel queda bloqueado.
  ventana.webContents.on('did-start-loading', () => bloquearAdmin())

  if (devServerUrl) {
    ventana.loadURL(urlDesarrollo(devServerUrl))
  } else {
    ventana.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * Solo desarrollo: TOTEM_PANTALLA=boleto npm run dev abre la app directo en esa pantalla, con
 * datos de ejemplo (state/dev.ts). TOTEM_NOMBRE cambia el nombre de ejemplo.
 */
function urlDesarrollo(base: string): string {
  const url = new URL(base)
  const pantalla = process.env['TOTEM_PANTALLA']
  const nombre = process.env['TOTEM_NOMBRE']
  if (pantalla) url.searchParams.set('pantalla', pantalla)
  if (nombre) url.searchParams.set('nombre', nombre)
  return url.toString()
}

app.on('window-all-closed', () => app.quit())
app.on('will-quit', () => log.info('Cierre de la app'))
process.on('uncaughtException', (err) => log.error('Excepción no controlada en main', err))
