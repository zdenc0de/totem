import { describe, expect, it } from 'vitest'
import { primerNombre } from './nombre'

describe('primerNombre', () => {
  it.each([
    ['zDENKO', 'Zdenko'],
    ['  maría josé ', 'María'],
    ['ÁNGEL', 'Ángel'],
    ['ana-sofía López', 'Ana-Sofía'],
    ["d'angelo", "D'Angelo"],
    ['ñoño', 'Ñoño'],
    ['', '']
  ])('%j → %j', (entrada, esperado) => expect(primerNombre(entrada)).toBe(esperado))
})
