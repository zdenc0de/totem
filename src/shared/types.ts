export type Talento = 'A' | 'I' | 'V'
export type Juego = 'simulador' | 'pera'
export type TotemId = 'T1' | 'T2'

export type Registro = {
  id: string
  totemId: TotemId
  createdAt: string
  nombre: string
  email: string
  telefono: string
  aceptoPrivacidad: true
  privacyVersion: string
  respuestas: Talento[]
  conteo: Record<Talento, number>
  talento: Talento
  juego: Juego
  desempate: boolean
  duracionSeg: number
}
