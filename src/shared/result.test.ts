import { describe, expect, it } from 'vitest'
import type { Juego, Talento } from './types'
import { CONTENIDO_POR_DEFECTO } from './content'
import { calcularResultado, esRespuestas, TALENTOS, type Reglas } from './result'

const reglas = CONTENIDO_POR_DEFECTO.reglas
const resp = (s: string): Talento[] => s.split(' ') as Talento[]

describe('calcularResultado: casos obligatorios (§6)', () => {
  it.each([
    // Gana uno solo: ese talento. Reflejo (V) va siempre al simulador.
    ['A A A I V', 'A', 'simulador', false],
    ['I I I A V', 'I', 'pera', false],
    ['V V V A I', 'V', 'simulador', false],
    ['V V V V V', 'V', 'simulador', false],
    ['I I I I I', 'I', 'pera', false],
    // Empate en el que está Impulsor: gana Impulsor (pera).
    ['A A I I V', 'I', 'pera', true],
    ['V A A I I', 'I', 'pera', true],
    ['A V I I A', 'I', 'pera', true],
    ['I I V V A', 'I', 'pera', true],
    ['V I A V I', 'I', 'pera', true],
    // Empate Acelerador-Reflejo: gana Impulsor si su única respuesta está en Q2 o Q4...
    ['A I V V A', 'I', 'pera', true],
    ['V A V I A', 'I', 'pera', true],
    // ...y si no, Acelerador.
    ['I A A V V', 'A', 'simulador', true],
    ['A A I V V', 'A', 'simulador', true],
    ['V V A A I', 'A', 'simulador', true],
    ['V A V A I', 'A', 'simulador', true]
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
    // Solo Impulsor va a la pera: ~51 % de las combinaciones (123 / 243).
    expect(porJuego).toEqual({ simulador: 120, pera: 123 })
    // Gana solo: 51 cada uno. Empates (30 por par): A-I e I-V a Impulsor; A-V a Impulsor en
    // 2 de 5 posiciones de su respuesta (12) y el resto (18) a Acelerador.
    expect(porTalento).toEqual({ A: 69, I: 123, V: 51 })
  })
})

describe('calcularResultado: reglas desde config', () => {
  it('usa el juego por talento de la config', () => {
    const otras: Reglas = { ...reglas, juegoPorTalento: { A: 'pera', I: 'simulador', V: 'pera' } }
    expect(calcularResultado(resp('A A A I V'), otras).juego).toBe('pera')
    expect(calcularResultado(resp('I I I A V'), otras).juego).toBe('simulador')
    expect(calcularResultado(resp('V V V A I'), otras).juego).toBe('pera')
  })

  it('cada pregunta en impulsorDesempataEn manda ~2.5 % más a la pera', () => {
    const peras = [[], [2], [2, 4], [2, 4, 5], [1, 2, 3, 4, 5]].map((preguntas) => {
      const otras = {
        ...reglas,
        desempate: { ...reglas.desempate, impulsorDesempataEn: preguntas }
      }
      const todas: Talento[][] = []
      const armar = (p: Talento[]): void => {
        if (p.length === 5) return void todas.push(p)
        for (const t of TALENTOS) armar([...p, t])
      }
      armar([])
      return todas.filter((r) => calcularResultado(r, otras).juego === 'pera').length
    })
    // 111 = 45.7 %, 117 = 48.1 %, 123 = 50.6 %, 129 = 53.1 %, 141 = 58.0 %.
    expect(peras).toEqual([111, 117, 123, 129, 141])
  })

  it('los ganadores de cada empate se pueden cambiar', () => {
    const otras: Reglas = {
      ...reglas,
      desempate: { 'A-I': 'A', 'A-V': 'V', 'I-V': 'V', impulsorDesempataEn: [] }
    }
    expect(calcularResultado(resp('A A I I V'), otras).talento).toBe('A')
    expect(calcularResultado(resp('A I V V A'), otras).talento).toBe('V')
    expect(calcularResultado(resp('I I V V A'), otras).talento).toBe('V')
  })
})

describe('esRespuestas', () => {
  it('acepta 5 respuestas A/I/V', () => expect(esRespuestas(['A', 'I', 'V', 'V', 'A'])).toBe(true))
  it.each([[[]], [['A', 'I', 'V', 'V']], [['A', 'I', 'V', 'V', 'X']], ['AIVVA'], [null]])(
    'rechaza %j',
    (valor) => expect(esRespuestas(valor)).toBe(false)
  )
})
