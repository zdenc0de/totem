import { describe, expect, it } from 'vitest'
import { CONTENIDO_POR_DEFECTO } from '@shared/content'
import { armarRegistro, type Contexto } from './registro'

const ctx: Contexto = {
  id: 'id-1',
  totemId: 'T2',
  privacyVersion: 'v1',
  reglas: CONTENIDO_POR_DEFECTO.reglas,
  ahora: new Date(2026, 9, 18, 10, 0, 0)
}

const campos = {
  nombre: '  Zdenko  ',
  apellido: 'Núñez  López',
  email: ' Zdenko@Correo.COM ',
  telefono: '5512345678',
  aceptoPrivacidad: true
}

describe('armarRegistro', () => {
  it('normaliza, recalcula el resultado y completa el registro', () => {
    const r = armarRegistro(
      { campos, respuestas: ['V', 'V', 'V', 'A', 'I'], duracionSeg: 41.6 },
      ctx
    )
    if ('error' in r) throw new Error(r.error)
    expect(r.registro).toMatchObject({
      id: 'id-1',
      totemId: 'T2',
      nombre: 'Zdenko',
      apellido: 'Núñez López',
      email: 'zdenko@correo.com',
      telefono: '5512345678',
      aceptoPrivacidad: true,
      privacyVersion: 'v1',
      respuestas: ['V', 'V', 'V', 'A', 'I'],
      conteo: { A: 1, I: 1, V: 3 },
      talento: 'V',
      juego: 'simulador',
      desempate: false,
      duracionSeg: 42
    })
    expect(r.registro.createdAt).toMatch(/^2026-10-18T10:00:00[+-]\d{2}:\d{2}$/)
  })

  it('ignora talento y juego que mande el renderer', () => {
    const r = armarRegistro(
      {
        campos,
        respuestas: ['A', 'A', 'A', 'I', 'V'],
        duracionSeg: 1,
        talento: 'V',
        juego: 'pera'
      },
      ctx
    )
    expect('registro' in r && [r.registro.talento, r.registro.juego]).toEqual(['A', 'simulador'])
  })

  it.each([
    [null, 'sin datos'],
    [{ respuestas: ['A', 'A', 'A', 'A', 'A'] }, 'campos incompletos'],
    [
      { campos: { ...campos, aceptoPrivacidad: false }, respuestas: ['A', 'A', 'A', 'A', 'A'] },
      'campos incompletos'
    ],
    [
      { campos: { ...campos, telefono: '55' }, respuestas: ['A', 'A', 'A', 'A', 'A'] },
      'campos inválidos'
    ],
    [{ campos, respuestas: ['A', 'A'] }, 'respuestas inválidas']
  ])('rechaza %j', (datos, error) => {
    expect(armarRegistro(datos, ctx)).toEqual({ error })
  })
})
