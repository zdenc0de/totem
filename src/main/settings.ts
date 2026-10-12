// settings.json (CLAUDE.md §9): ID de tótem, si ya se confirmó y el hash del PIN si se cambió.
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  writeSync
} from 'fs'
import { dirname, join } from 'path'
import type { TotemId } from '@shared/types'
import { sinLog, type Logger } from './storage'

export type Settings = {
  totemId: TotemId
  /** `false` hasta que alguien elige T1 o T2 desde el panel. */
  idConfirmado: boolean
  /** Hash scrypt del PIN; `null` mientras siga el PIN de fábrica. */
  pinHash: string | null
}

export type SettingsStore = {
  leer: () => Settings
  guardar: (cambios: Partial<Settings>) => void
}

const POR_DEFECTO: Settings = { totemId: 'T1', idConfirmado: false, pinHash: null }

export function crearSettings(dirData: string, log: Logger = sinLog): SettingsStore {
  const ruta = join(dirData, 'settings.json')
  let actual = cargar(ruta, log)

  return {
    leer: () => ({ ...actual }),
    guardar(cambios) {
      const nuevo = { ...actual, ...cambios }
      escribirAtomico(ruta, JSON.stringify(nuevo, null, 2) + '\n')
      actual = nuevo
    }
  }
}

function cargar(ruta: string, log: Logger): Settings {
  if (!existsSync(ruta)) return { ...POR_DEFECTO }
  try {
    const s = JSON.parse(readFileSync(ruta, 'utf8')) as Partial<Settings>
    return {
      totemId: s.totemId === 'T2' ? 'T2' : 'T1',
      idConfirmado: s.idConfirmado === true,
      pinHash: typeof s.pinHash === 'string' ? s.pinHash : null
    }
  } catch (err) {
    log.error('settings.json inválido; se usan los valores por defecto', String(err))
    return { ...POR_DEFECTO }
  }
}

/** Archivo temporal + fsync + rename: nunca queda un settings.json a medias. */
function escribirAtomico(ruta: string, texto: string): void {
  mkdirSync(dirname(ruta), { recursive: true })
  const temporal = `${ruta}.tmp`
  const fd = openSync(temporal, 'w')
  try {
    writeSync(fd, texto)
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
  renameSync(temporal, ruta)
}
