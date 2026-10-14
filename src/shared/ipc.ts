// Nombres de canal y tipos compartidos por main y preload. El renderer nunca usa los canales directo.
import type { Juego, Talento, TotemId } from './types'
import type { CamposRegistro } from './validation'
import type { Resultado } from './result'

export const IPC = {
  configGet: 'config:get',
  existeDuplicado: 'registro:existeDuplicado',
  guardarRegistro: 'registro:guardar',
  adminVerificarPin: 'admin:verificarPin',
  adminBloquear: 'admin:bloquear',
  adminEstado: 'admin:estado',
  adminCambiarPin: 'admin:cambiarPin',
  adminSetTotemId: 'admin:setTotemId',
  adminExportar: 'admin:exportar',
  adminPrepararRespaldo: 'admin:prepararRespaldo',
  adminSalir: 'admin:salir',
  alertaSistema: 'sistema:alerta'
} as const

export type Duplicados = { email: boolean; telefono: boolean }

export type DatosGuardar = {
  campos: CamposRegistro
  respuestas: Talento[]
  duracionSeg: number
}

/** `resultado` es el que calculó main; `null` si rechazó los datos (el renderer calcula el suyo). */
export type RespuestaGuardar = { guardado: boolean; resultado: Resultado | null }

export type ResultadoExportar =
  { ok: true; total: number; archivos: string[] } | { ok: false; motivo: 'cancelado' | 'error' }

/** Respaldo en la USB fija. `unidad` es null si no hay USB con la carpeta TotemRespaldo. */
export type EstadoRespaldo = {
  unidad: string | null
  /** Código del último error al escribir en la USB (p. ej. ENOSPC); null si va bien. */
  error: string | null
  registros: number
  enUsb: number
  /** Hora local de la última vez que se regeneró el Excel en la USB. */
  excelActualizado: string | null
}

export type ResultadoPrepararRespaldo = 'ok' | 'cancelado' | 'unidad-del-sistema' | 'error'

export type EstadoAdmin = {
  total: number
  porTalento: Record<Talento, number>
  porJuego: Record<Juego, number>
  totemId: TotemId
  idConfirmado: boolean
  pinDeFabrica: boolean
  qrPendiente: Talento[]
  respaldo: EstadoRespaldo
  /** Registros que no se pudieron guardar en el disco desde que arrancó la app. */
  fallosGuardado: number
  /** Fecha y hora del tótem: sin internet no se sincronizan solas, hay que revisarlas. */
  ahora: string
}
