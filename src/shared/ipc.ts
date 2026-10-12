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
  adminSalir: 'admin:salir'
} as const

export type Duplicados = { email: boolean; telefono: boolean }

export type DatosGuardar = {
  campos: CamposRegistro
  respuestas: Talento[]
  duracionSeg: number
}

/** `resultado` es el que calculó main; `null` si rechazó los datos (el renderer calcula el suyo). */
export type RespuestaGuardar = { guardado: boolean; resultado: Resultado | null }

export type EstadoAdmin = {
  total: number
  porTalento: Record<Talento, number>
  porJuego: Record<Juego, number>
  totemId: TotemId
  idConfirmado: boolean
  pinDeFabrica: boolean
  qrPendiente: Juego[]
}
