// Respaldo en tiempo real a una USB fija en el tótem. Protege contra lo que el backup en el
// mismo disco no cubre: que el tótem se dañe o desaparezca.
//
// - Solo se usa una unidad que tenga la carpeta `TotemRespaldo` en su raíz (nunca la del sistema),
//   así no se escribe en cualquier USB que alguien conecte.
// - Cada registro se agrega a `registros_{T1}.jsonl` con fsync, igual que en el disco.
// - Si la USB se desconecta, el tótem sigue funcionando; al volver, se copian los que falten.
// - `registros_{T1}.xlsx` y `.csv` se regeneran cada `excelCada` registros (10) o cada `excelMs` (30 s),
//   con archivo temporal + rename: nunca quedan a medias.
// No depende de Electron para poder probarse con Vitest.
import { existsSync, mkdirSync } from 'fs'
import { join, parse } from 'path'
import type { Contenido } from '@shared/content'
import type { Registro, TotemId } from '@shared/types'
import type { EstadoRespaldo } from '@shared/ipc'
import { isoLocal } from '@shared/fecha'
import { agregarLineas, leerJsonl, sinLog, type Logger } from './storage'
import { escribirExport, tablaExport } from './export'

export const CARPETA_RESPALDO = 'TotemRespaldo'

export type OpcionesRespaldo = {
  /** Raíces de unidad candidatas (p. ej. "D:\\"). */
  raices: () => string[]
  /** Raíz de la unidad del sistema: ahí nunca se respalda. */
  raizSistema: string
  registros: () => Registro[]
  totemId: () => TotemId
  contenido: Contenido
  log?: Logger
  excelCada?: number
  excelMs?: number
  ahora?: () => Date
}

export type Respaldo = {
  /** Copia a la USB lo que falte y, si toca, regenera el Excel. Nunca lanza. */
  sincronizar: () => Promise<void>
  estado: () => EstadoRespaldo
  /** Crea la carpeta de respaldo en la raíz de la unidad de `ruta`. */
  preparar: (ruta: string) => 'ok' | 'unidad-del-sistema' | 'error'
}

export function crearRespaldo(op: OpcionesRespaldo): Respaldo {
  const log = op.log ?? sinLog
  const excelCada = op.excelCada ?? 10
  const excelMs = op.excelMs ?? 30_000
  const ahora = op.ahora ?? (() => new Date())
  const sistema = normalizarRaiz(op.raizSistema)

  // Ids que ya están en el archivo de la USB. Se vuelve a leer si cambia la USB o falla algo.
  let cache: { archivo: string; ids: Set<string> } | null = null
  let sinExcel = 0
  let excelPendiente = true
  let ultimoExcelMs = 0
  let excelActualizado: string | null = null
  let usb: string | null = null
  let error: string | null = null
  let enCurso: Promise<void> | null = null
  let otraVez = false

  function buscarUsb(): string | null {
    for (const raiz of op.raices()) {
      if (normalizarRaiz(raiz) === sistema) continue
      try {
        if (existsSync(join(raiz, CARPETA_RESPALDO))) return raiz
      } catch {
        // Unidad no disponible (lector sin tarjeta, etc.).
      }
    }
    return null
  }

  async function paso(): Promise<void> {
    const raiz = buscarUsb()
    if (raiz !== usb) {
      if (raiz) log.info('USB de respaldo detectada', { unidad: raiz })
      else if (usb) log.warn('USB de respaldo desconectada')
    }
    usb = raiz
    if (!raiz) {
      cache = null
      error = null
      return
    }

    const id = op.totemId()
    const dir = join(raiz, CARPETA_RESPALDO)
    const archivo = join(dir, `registros_${id}.jsonl`)
    try {
      const recienLeido = cache?.archivo !== archivo
      if (recienLeido) excelPendiente = true
      const enUsb: Set<string> =
        cache && !recienLeido ? cache.ids : new Set(leerJsonl(archivo, log).map((r) => r.id))
      cache = { archivo, ids: enUsb }
      const todos = op.registros()
      const faltan = todos.filter((r) => !enUsb.has(r.id))
      if (faltan.length > 0) {
        agregarLineas(archivo, faltan.map((r) => JSON.stringify(r) + '\n').join(''))
        for (const r of faltan) enUsb.add(r.id)
        sinExcel += faltan.length
        // Solo al conectar o reconectar la USB; en operación normal sería ruido.
        if (recienLeido) log.info('USB de respaldo puesta al día', { copiados: faltan.length })
      }

      const base = `registros_${id}`
      const t = ahora().getTime()
      const tocaExcel =
        todos.length > 0 &&
        (excelPendiente ||
          !existsSync(join(dir, `${base}.xlsx`)) ||
          sinExcel >= excelCada ||
          (sinExcel > 0 && t - ultimoExcelMs >= excelMs))
      if (tocaExcel) {
        await escribirExport(dir, base, tablaExport(todos, op.contenido))
        sinExcel = 0
        excelPendiente = false
        ultimoExcelMs = t
        excelActualizado = isoLocal(ahora())
      }
      if (error) log.info('Respaldo en USB recuperado')
      error = null
    } catch (err) {
      const codigo = (err as NodeJS.ErrnoException)?.code ?? 'ERROR'
      if (error !== codigo) log.error('Falló el respaldo en USB', { codigo })
      error = codigo
      cache = null
    }
  }

  return {
    sincronizar() {
      // Una sola sincronización a la vez; si llega otra petición mientras corre, se repite al final.
      if (enCurso) {
        otraVez = true
        return enCurso
      }
      enCurso = (async () => {
        try {
          do {
            otraVez = false
            await paso()
          } while (otraVez)
        } catch (err) {
          log.error('Error inesperado en el respaldo', String(err))
        } finally {
          enCurso = null
        }
      })()
      return enCurso
    },

    estado() {
      const total = op.registros().length
      const enUsb = cache ? op.registros().filter((r) => cache!.ids.has(r.id)).length : 0
      return {
        unidad: usb,
        error,
        registros: total,
        enUsb: usb && !error ? enUsb : 0,
        excelActualizado: usb ? excelActualizado : null
      }
    },

    preparar(ruta) {
      const raiz = parse(ruta).root
      if (!raiz || normalizarRaiz(raiz) === sistema) return 'unidad-del-sistema'
      try {
        mkdirSync(join(raiz, CARPETA_RESPALDO), { recursive: true })
        log.info('USB de respaldo preparada', { unidad: raiz })
        excelPendiente = true
        return 'ok'
      } catch (err) {
        log.error('No se pudo preparar la USB de respaldo', String(err))
        return 'error'
      }
    }
  }
}

/** "d:", "D:\\" y "D:/" son la misma unidad. */
function normalizarRaiz(raiz: string): string {
  return raiz.replace(/[\\/]+$/, '').toUpperCase()
}

/** Unidades D: a Z: de Windows (A: y B: son disqueteras; C: suele ser el sistema). */
export function raicesWindows(): string[] {
  return 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => `${l}:\\`)
}
