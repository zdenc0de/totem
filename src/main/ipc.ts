// Handlers IPC del proceso principal (CLAUDE.md §9 y §11). Los de admin solo responden
// después de verificar el PIN.
import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { IPC, type EstadoAdmin, type RespuestaGuardar, type ResultadoExportar } from '@shared/ipc'
import type { ConfigRenderer, Contenido } from '@shared/content'
import type { Juego } from '@shared/types'
import { normalizarEmail } from '@shared/validation'
import { log } from './log'
import { armarRegistro } from './registro'
import { esPinValido, hashPin, verificarPin } from './pin'
import type { Storage } from './storage'
import type { SettingsStore } from './settings'
import { escribirExport, nombreExport, tablaExport } from './export'

export type Dependencias = {
  storage: Storage
  settings: SettingsStore
  contenido: Contenido
  qr: Record<Juego, string | null>
  /** Diálogo para elegir la carpeta de exportación (la USB); `null` si se cancela. */
  elegirCarpeta: () => Promise<string | null>
  salir: () => void
}

// Tras 5 PIN incorrectos seguidos, se ignoran los intentos durante 30 s.
const MAX_FALLOS = 5
const ESPERA_MS = 30_000

export function registrarIpc(deps: Dependencias): {
  bloquearAdmin: () => void
} {
  const { storage, settings, contenido, qr, elegirCarpeta, salir } = deps
  let desbloqueado = false
  let fallos = 0
  let esperarHasta = 0

  const soloAdmin =
    <A extends unknown[], R>(canal: string, fn: (...args: A) => R) =>
    (_e: unknown, ...args: A): R => {
      if (!desbloqueado) {
        log.warn('Llamada de admin sin PIN rechazada', { canal })
        throw new Error('Panel bloqueado')
      }
      return fn(...args)
    }

  const { adminPinDefault, ...resto } = contenido
  const config: ConfigRenderer = { ...resto, qr }
  ipcMain.handle(IPC.configGet, () => config)

  ipcMain.handle(IPC.existeDuplicado, (_e, datos: unknown) => {
    const { email, telefono } = (datos ?? {}) as Record<string, unknown>
    return storage.existe({
      email: typeof email === 'string' ? normalizarEmail(email) : '',
      telefono: typeof telefono === 'string' ? telefono : ''
    })
  })

  ipcMain.handle(IPC.guardarRegistro, (_e, datos: unknown): RespuestaGuardar => {
    const armado = armarRegistro(datos, {
      id: randomUUID(),
      totemId: settings.leer().totemId,
      privacyVersion: contenido.privacidad.version,
      reglas: contenido.reglas,
      ahora: new Date()
    })
    if ('error' in armado) {
      log.warn('Registro rechazado', { motivo: armado.error })
      return { guardado: false, resultado: null }
    }
    const { registro, resultado } = armado
    const dup = storage.existe(registro)
    if (dup.email || dup.telefono) {
      log.warn('Registro duplicado al guardar; no se guarda', dup)
      return { guardado: false, resultado }
    }
    const guardado = storage.guardar(registro)
    if (guardado)
      log.info('Registro guardado', { talento: resultado.talento, juego: resultado.juego })
    return { guardado, resultado }
  })

  ipcMain.handle(IPC.adminVerificarPin, (_e, pin: unknown) => {
    if (Date.now() < esperarHasta) return false
    const ok = verificarPin(pin, settings.leer().pinHash, adminPinDefault)
    if (ok) {
      desbloqueado = true
      fallos = 0
      log.info('Panel admin abierto')
    } else if (++fallos >= MAX_FALLOS) {
      esperarHasta = Date.now() + ESPERA_MS
      fallos = 0
      log.warn('Demasiados PIN incorrectos; espera de 30 s')
    }
    return ok
  })

  const bloquearAdmin = (): void => {
    if (desbloqueado) log.info('Panel admin cerrado')
    desbloqueado = false
  }
  ipcMain.handle(IPC.adminBloquear, bloquearAdmin)

  ipcMain.handle(
    IPC.adminEstado,
    soloAdmin(IPC.adminEstado, (): EstadoAdmin => {
      const registros = storage.leerTodos()
      const porTalento = { A: 0, I: 0, V: 0 }
      const porJuego = { simulador: 0, pera: 0 }
      for (const r of registros) {
        porTalento[r.talento]++
        porJuego[r.juego]++
      }
      const s = settings.leer()
      return {
        total: registros.length,
        porTalento,
        porJuego,
        totemId: s.totemId,
        idConfirmado: s.idConfirmado,
        pinDeFabrica: s.pinHash === null,
        qrPendiente: (['simulador', 'pera'] as const).filter((j) => !qr[j])
      }
    })
  )

  ipcMain.handle(
    IPC.adminCambiarPin,
    soloAdmin(IPC.adminCambiarPin, (pin: unknown) => {
      if (!esPinValido(pin)) return false
      settings.guardar({ pinHash: hashPin(pin) })
      log.info('PIN de administrador cambiado')
      return true
    })
  )

  ipcMain.handle(
    IPC.adminSetTotemId,
    soloAdmin(IPC.adminSetTotemId, (id: unknown) => {
      if (id !== 'T1' && id !== 'T2') return false
      settings.guardar({ totemId: id, idConfirmado: true })
      log.info('ID de tótem configurado', { totemId: id })
      return true
    })
  )

  ipcMain.handle(
    IPC.adminExportar,
    soloAdmin(IPC.adminExportar, async (): Promise<ResultadoExportar> => {
      const carpeta = await elegirCarpeta()
      if (!carpeta) return { ok: false, motivo: 'cancelado' }
      const registros = storage.leerTodos()
      try {
        const nombre = nombreExport(settings.leer().totemId, new Date())
        const archivos = await escribirExport(carpeta, nombre, tablaExport(registros, contenido))
        log.info('Exportación terminada', { total: registros.length, archivos })
        return { ok: true, total: registros.length, archivos }
      } catch (err) {
        log.error('Exportación fallida', String(err))
        return { ok: false, motivo: 'error' }
      }
    })
  )

  ipcMain.handle(IPC.adminSalir, soloAdmin(IPC.adminSalir, salir))

  return { bloquearAdmin }
}
