import { describe, expect, it } from 'vitest'
import type { Juego, Talento } from './types'
import { CONTENIDO_POR_DEFECTO } from './content'
import { calcularResultado, esRespuestas, TALENTOS } from './result'

const reglas = CONTENIDO_POR_DEFECTO.reglas
const resp = (s: string): Talento[] => s.split(' ') as Talento[]

describe('calcularResultado: casos obligatorios (§6)', () => {
  it.each([
    ['A A A I V', 'A', 'simulador', false],
    ['I I I A V', 'I', 'pera', false],
    ['V V V A I', 'V', 'simulador', false],
    ['A A I I V', 'V', 'pera', true],
    ['V A A I I', 'V', 'simulador', true],
    ['A V I I A', 'V', 'pera', true],
    ['V V A A I', 'V', 'pera', true],
    ['V A V A I', 'V', 'simulador', true],
    ['V V V V V', 'V', 'pera', false]
  ] as const)('%s → %s / %s', (respuestas, talento, juego, desempate) => {
    const r = calcularResultado(resp(respuestas), reglas)
    expect(r.talento).toBe(talento)
    expect(r.juego).toBe(juego)
    expect(r.desempate).toBe(desempate)
  })

  it('cuenta las respuestas', () => {
    expect(calcularResultado(resp('A A I I V'), reglas).conteo).toEqual({ A: 2, I: 2, V: 1 })
  })
})

describe('calcularResultado: las 243 combinaciones', () => {
  const todas: Talento[][] = []
  const armar = (prefijo: Talento[]): void => {
    if (prefijo.length === 5) return void todas.push(prefijo)
    for (const t of TALENTOS) armar([...prefijo, t])
  }
  armar([])

  it('siempre da un talento y un juego válidos con la distribución esperada', () => {
    expect(todas).toHaveLength(243)
    const porJuego: Record<Juego, number> = { simulador: 0, pera: 0 }
    const porTalento: Record<Talento, number> = { A: 0, I: 0, V: 0 }
    for (const respuestas of todas) {
      const r = calcularResultado(respuestas, reglas)
      expect(TALENTOS).toContain(r.talento)
      expect(['simulador', 'pera']).toContain(r.juego)
      // Garantía del §6: si el resultado es V, hay al menos una respuesta V.
      if (r.talento === 'V') expect(r.conteo.V).toBeGreaterThan(0)
      porJuego[r.juego]++
      porTalento[r.talento]++
    }
    expect(porJuego).toEqual({ simulador: 81, pera: 162 })
    expect(porTalento).toEqual({ A: 51, I: 51, V: 141 })
  })
})

describe('calcularResultado: reglas desde config', () => {
  it('usa el juego por talento y la regla de empate de la config', () => {
    const otras = {
      juegoPorTalento: { A: 'pera', I: 'simulador' },
      versatilPorPregunta: ['pera', 'simulador', 'pera', 'simulador', 'simulador'],
      empateVersatil: 'simulador'
    } satisfies typeof reglas
    expect(calcularResultado(resp('A A A I V'), otras).juego).toBe('pera')
    expect(calcularResultado(resp('V V A A I'), otras).juego).toBe('simulador')
    expect(calcularResultado(resp('V A V A I'), otras).juego).toBe('pera')
  })
})

describe('esRespuestas', () => {
  it('acepta 5 respuestas A/I/V', () => expect(esRespuestas(['A', 'I', 'V', 'V', 'A'])).toBe(true))
  it.each([[[]], [['A', 'I', 'V', 'V']], [['A', 'I', 'V', 'V', 'X']], ['AIVVA'], [null]])(
    'rechaza %j',
    (valor) => expect(esRespuestas(valor)).toBe(false)
  )
})
