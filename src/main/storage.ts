// Persistencia de registros (CLAUDE.md §9): JSONL de solo agregar, con fsync, copia espejo
// en backup/ y Sets en memoria de correos y teléfonos para bloquear duplicados.
// No depende de Electron para poder probarse con Vitest; el log se inyecta.
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, writeSync } from 'fs'
import { join } from 'path'
import type { Registro } from '@shared/types'
import type { Duplicados } from '@shared/ipc'

export type Logger = {
  info: (m: string, extra?: unknown) => void
  warn: (m: string, extra?: unknown) => void
  error: (m: string, extra?: unknown) => void
}

export const sinLog: Logger = { info: () => {}, warn: () => {}, error: () => {} }

export type Storage = {
  existe: (datos: { email: string; telefono: string }) => Duplicados
  /** `true` si el registro quedó escrito en el archivo principal, en el backup o en ambos. */
  guardar: (registro: Registro) => boolean
  /** Todos los registros (principal + los que solo están en el backup), en orden de guardado. */
  leerTodos: () => Registro[]
}

export function rutasDatos(dirData: string): { principal: string; backup: string } {
  return {
    principal: join(dirData, 'registros.jsonl'),
    backup: join(dirData, 'backup', 'registros_backup.jsonl')
  }
}

export function crearStorage(dirData: string, log: Logger = sinLog): Storage {
  const rutas = rutasDatos(dirData)
  mkdirSync(join(dirData, 'backup'), { recursive: true })

  const porId = new Map<string, Registro>()
  for (const ruta of [rutas.principal, rutas.backup]) {
    for (const r of leerArchivo(ruta, log)) if (!porId.has(r.id)) porId.set(r.id, r)
  }
  const registros = [...porId.values()]
  const emails = new Set(registros.map((r) => r.email))
  const telefonos = new Set(registros.map((r) => r.telefono))
  log.info('Registros cargados', { total: registros.length })

  function escribirEnAmbos(linea: string, pendientes: string[]): string[] {
    return pendientes.filter((ruta) => {
      try {
        agregarLinea(ruta, linea)
        return false
      } catch (err) {
        log.error('No se pudo escribir el registro', {
          archivo: nombreArchivo(ruta),
          err: String(err)
        })
        return true
      }
    })
  }

  return {
    existe: ({ email, telefono }) => ({
      email: emails.has(email),
      telefono: telefonos.has(telefono)
    }),

    guardar(registro) {
      const linea = JSON.stringify(registro) + '\n'
      const todos = [rutas.principal, rutas.backup]
      let fallidos = escribirEnAmbos(linea, todos)
      // Basta con uno de los dos; si fallan ambos, un reintento.
      if (fallidos.length === todos.length) fallidos = escribirEnAmbos(linea, todos)
      if (fallidos.length === todos.length) {
        log.error('Registro perdido: fallaron el archivo principal y el backup')
        return false
      }
      registros.push(registro)
      emails.add(registro.email)
      telefonos.add(registro.telefono)
      return true
    },

    leerTodos: () => [...registros]
  }
}

/** open → write → fsync → close: la línea queda en disco antes de seguir. */
function agregarLinea(ruta: string, linea: string): void {
  const fd = openSync(ruta, 'a')
  try {
    writeSync(fd, linea)
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
}

/**
 * Lee un JSONL tolerando una última línea truncada (proceso muerto a media escritura) o
 * líneas dañadas: se omiten y se avisa en el log. Si el archivo no termina en salto de línea
 * se le agrega uno, para que el siguiente registro no quede pegado a la línea rota.
 */
function leerArchivo(ruta: string, log: Logger): Registro[] {
  if (!existsSync(ruta)) return []
  let texto: string
  try {
    texto = readFileSync(ruta, 'utf8')
  } catch (err) {
    log.error('No se pudo leer el archivo de registros', {
      archivo: nombreArchivo(ruta),
      err: String(err)
    })
    return []
  }
  if (texto.length > 0 && !texto.endsWith('\n')) {
    try {
      agregarLinea(ruta, '\n')
    } catch {
      // Si no se puede reparar, la siguiente escritura lo volverá a intentar desde cero.
    }
  }

  const registros: Registro[] = []
  let danadas = 0
  for (const linea of texto.split('\n')) {
    if (!linea.trim()) continue
    try {
      const r = JSON.parse(linea)
      if (esRegistroLeido(r)) registros.push(r)
      else danadas++
    } catch {
      danadas++
    }
  }
  if (danadas > 0) log.warn('Líneas dañadas omitidas', { archivo: nombreArchivo(ruta), danadas })
  return registros
}

function esRegistroLeido(r: unknown): r is Registro {
  if (typeof r !== 'object' || r === null) return false
  const { id, email, telefono } = r as Record<string, unknown>
  return typeof id === 'string' && typeof email === 'string' && typeof telefono === 'string'
}

// Solo el nombre del archivo: la ruta de userData incluye el usuario de Windows.
function nombreArchivo(ruta: string): string {
  return ruta.split(/[\\/]/).pop() ?? ''
}
