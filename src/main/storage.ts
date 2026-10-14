// Persistencia de registros (CLAUDE.md §9): JSONL de solo agregar, con fsync, copia espejo
// en backup/ y Sets en memoria de correos y teléfonos para bloquear duplicados.
// No depende de Electron para poder probarse con Vitest; el log se inyecta.
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, writeSync } from 'fs'
import { join } from 'path'
import type { Juego, Registro, Talento } from '@shared/types'
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
  /** Registros que no se pudieron escribir en ningún archivo desde que arrancó la app. */
  fallos: () => number
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

  const enPrincipal = leerJsonl(rutas.principal, log)
  const enBackup = leerJsonl(rutas.backup, log)
  const porId = new Map<string, Registro>()
  for (const r of [...enPrincipal, ...enBackup]) if (!porId.has(r.id)) porId.set(r.id, r)
  const registros = [...porId.values()]

  // Si la app murió entre la escritura del principal y la del backup, a uno le falta ese
  // registro: se le agrega para que las dos copias vuelvan a estar completas.
  emparejar(rutas.principal, enPrincipal, registros, log)
  emparejar(rutas.backup, enBackup, registros, log)

  const emails = new Set(registros.map((r) => r.email))
  const telefonos = new Set(registros.map((r) => r.telefono))
  let fallos = 0
  log.info('Registros cargados', { total: registros.length })

  function escribirEnAmbos(linea: string, pendientes: string[]): string[] {
    return pendientes.filter((ruta) => {
      try {
        agregarLineas(ruta, linea)
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
        fallos++
        log.error('Registro perdido: fallaron el archivo principal y el backup')
        return false
      }
      registros.push(registro)
      emails.add(registro.email)
      telefonos.add(registro.telefono)
      return true
    },

    leerTodos: () => [...registros],
    fallos: () => fallos
  }
}

function emparejar(ruta: string, presentes: Registro[], todos: Registro[], log: Logger): void {
  const ids = new Set(presentes.map((r) => r.id))
  const faltan = todos.filter((r) => !ids.has(r.id))
  if (faltan.length === 0) return
  try {
    agregarLineas(ruta, faltan.map((r) => JSON.stringify(r) + '\n').join(''))
    log.warn('Copia completada al arrancar', {
      archivo: nombreArchivo(ruta),
      agregados: faltan.length
    })
  } catch (err) {
    log.error('No se pudo completar la copia', { archivo: nombreArchivo(ruta), err: String(err) })
  }
}

/** open → write → fsync → close: el texto queda en disco antes de seguir. */
export function agregarLineas(ruta: string, texto: string): void {
  const fd = openSync(ruta, 'a')
  try {
    writeSync(fd, texto)
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
}

/**
 * Lee un JSONL tolerando una última línea truncada (proceso muerto a media escritura) o
 * líneas dañadas o incompletas: se omiten y se avisa en el log. Si el archivo no termina en
 * salto de línea se le agrega uno, para que el siguiente registro no quede pegado a la línea rota.
 */
export function leerJsonl(ruta: string, log: Logger): Registro[] {
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
      agregarLineas(ruta, '\n')
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
      if (esRegistro(r)) registros.push(r)
      else danadas++
    } catch {
      danadas++
    }
  }
  if (danadas > 0) log.warn('Líneas dañadas omitidas', { archivo: nombreArchivo(ruta), danadas })
  return registros
}

const TALENTOS: unknown[] = ['A', 'I', 'V'] satisfies Talento[]
const JUEGOS: unknown[] = ['simulador', 'pera'] satisfies Juego[]
const esTexto = (v: unknown): v is string => typeof v === 'string'
const esNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Un registro con todos sus campos: lo que no cumple no llega al panel ni al Excel. */
export function esRegistro(r: unknown): r is Registro {
  if (typeof r !== 'object' || r === null) return false
  const x = r as Record<string, unknown>
  const conteo = x.conteo as Record<string, unknown> | null
  return (
    [x.id, x.createdAt, x.nombre, x.apellido, x.email, x.telefono, x.privacyVersion].every(
      esTexto
    ) &&
    (x.totemId === 'T1' || x.totemId === 'T2') &&
    x.aceptoPrivacidad === true &&
    Array.isArray(x.respuestas) &&
    x.respuestas.length === 5 &&
    x.respuestas.every((t) => TALENTOS.includes(t)) &&
    typeof conteo === 'object' &&
    conteo !== null &&
    [conteo.A, conteo.I, conteo.V].every(esNumero) &&
    TALENTOS.includes(x.talento) &&
    JUEGOS.includes(x.juego) &&
    typeof x.desempate === 'boolean' &&
    esNumero(x.duracionSeg)
  )
}

// Solo el nombre del archivo: la ruta de userData incluye el usuario de Windows.
export function nombreArchivo(ruta: string): string {
  return ruta.split(/[\\/]/).pop() ?? ''
}
