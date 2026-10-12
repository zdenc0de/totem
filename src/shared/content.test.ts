import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { CONTENIDO_POR_DEFECTO, contenidoSchema } from './content'

describe('content.json', () => {
  it('los valores por defecto cumplen el esquema', () => {
    expect(contenidoSchema.safeParse(CONTENIDO_POR_DEFECTO).success).toBe(true)
  })

  it('resources/content.json cumple el esquema', () => {
    const json = JSON.parse(readFileSync(join(__dirname, '../../resources/content.json'), 'utf8'))
    const r = contenidoSchema.safeParse(json)
    expect(r.error?.issues ?? []).toEqual([])
  })

  it('rechaza un PIN no numérico y reglas incompletas', () => {
    expect(
      contenidoSchema.safeParse({ ...CONTENIDO_POR_DEFECTO, adminPinDefault: 'PENDIENTE' }).success
    ).toBe(false)
    const reglas = { ...CONTENIDO_POR_DEFECTO.reglas, versatilPorPregunta: ['pera'] }
    expect(contenidoSchema.safeParse({ ...CONTENIDO_POR_DEFECTO, reglas }).success).toBe(false)
  })
})
