// Log a archivo en userData/logs/. NUNCA registrar datos personales
// (nombre, correo, teléfono): solo eventos técnicos y conteos.
import { app } from 'electron'
import { appendFileSync, mkdirSync } from 'fs'
import { join } from 'path'

type Nivel = 'INFO' | 'WARN' | 'ERROR'

let logDir: string | null = null

function archivoDelDia(): string {
  if (!logDir) {
    logDir = join(app.getPath('userData'), 'logs')
    mkdirSync(logDir, { recursive: true })
  }
  const d = new Date()
  const dia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return join(logDir, `totem_${dia}.log`)
}

function escribir(nivel: Nivel, mensaje: string, extra?: unknown): void {
  const detalle =
    extra instanceof Error
      ? ` ${extra.stack ?? extra.message}`
      : extra
        ? ` ${JSON.stringify(extra)}`
        : ''
  const linea = `${new Date().toISOString()} [${nivel}] ${mensaje}${detalle}\n`
  try {
    appendFileSync(archivoDelDia(), linea, 'utf8')
  } catch {
    // Si el disco falla no hay mucho más que hacer; no tumbar la app por el log.
  }
  if (!app.isPackaged) console.log(linea.trimEnd())
}

export const log = {
  info: (m: string, extra?: unknown) => escribir('INFO', m, extra),
  warn: (m: string, extra?: unknown) => escribir('WARN', m, extra),
  error: (m: string, extra?: unknown) => escribir('ERROR', m, extra)
}
