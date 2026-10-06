import { describe, expect, it } from 'vitest'
import { DISENOS, borrar, escribir, mayusculaAutomatica } from './teclas'

const textos = (diseno: keyof typeof DISENOS): string[] =>
  DISENOS[diseno].flat().flatMap((t) => (t.tipo === 'texto' ? [t.valor] : []))

describe('diseños', () => {
  it('el alfabético trae ñ, acentos, apóstrofe y guion', () => {
    expect(textos('alfabetico')).toEqual(expect.arrayContaining([...'ñáéíóúü', "'", '-']))
  })

  it('el de correo trae @, punto y los atajos de dominio', () => {
    expect(textos('correo')).toEqual(
      expect.arrayContaining(['@', '.', '@gmail.com', '@hotmail.com', '@outlook.com', '.com'])
    )
  })

  it('el numérico trae solo los 10 dígitos', () => {
    expect(textos('numerico').sort()).toEqual([...'0123456789'])
  })

  it('todos tienen borrar y tecla de acción', () => {
    for (const filas of Object.values(DISENOS)) {
      const tipos = filas.flat().map((t) => t.tipo)
      expect(tipos).toContain('borrar')
      expect(tipos).toContain('accion')
    }
  })
})

describe('escribir', () => {
  it('agrega al final', () => {
    expect(escribir('An', 'a')).toBe('Ana')
    expect(escribir('ana@gmail', '.com')).toBe('ana@gmail.com')
  })

  it('un atajo de dominio sustituye lo escrito después de la @', () => {
    expect(escribir('ana', '@gmail.com')).toBe('ana@gmail.com')
    expect(escribir('ana@', '@hotmail.com')).toBe('ana@hotmail.com')
    expect(escribir('ana@gm', '@gmail.com')).toBe('ana@gmail.com')
    expect(escribir('ana@gmail.com', '@outlook.com')).toBe('ana@outlook.com')
  })

  it('la @ sola se agrega tal cual', () => {
    expect(escribir('ana', '@')).toBe('ana@')
  })
})

describe('borrar', () => {
  it('quita el último carácter', () => {
    expect(borrar('Ñandú')).toBe('Ñand')
    expect(borrar('')).toBe('')
  })
})

describe('mayúscula automática', () => {
  it.each([
    ['', true],
    ['María ', true],
    ['Ana-', true],
    ['M', false],
    ['María', false],
    ["D'", false]
  ])('%j → %s', (valor, esperado) => expect(mayusculaAutomatica(valor)).toBe(esperado))
})
