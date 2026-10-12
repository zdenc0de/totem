import { describe, expect, it } from 'vitest'
import { esPinValido, hashPin, verificarPin } from './pin'

describe('pin', () => {
  it('sin hash, compara contra el PIN de fábrica', () => {
    expect(verificarPin('1234', null, '1234')).toBe(true)
    expect(verificarPin('1235', null, '1234')).toBe(false)
  })

  it('con hash, ignora el PIN de fábrica', () => {
    const hash = hashPin('987654')
    expect(hash).not.toContain('987654')
    expect(verificarPin('987654', hash, '1234')).toBe(true)
    expect(verificarPin('1234', hash, '1234')).toBe(false)
  })

  it('dos hashes del mismo PIN son distintos (sal aleatoria)', () => {
    expect(hashPin('1234')).not.toBe(hashPin('1234'))
  })

  it.each([['123'], ['123456789'], ['12a4'], [1234], [null]])('rechaza %j', (pin) => {
    expect(esPinValido(pin)).toBe(false)
    expect(verificarPin(pin, null, '1234')).toBe(false)
  })

  it('un hash dañado no deja pasar', () => {
    expect(verificarPin('1234', 'basura', '1234')).toBe(false)
  })
})
