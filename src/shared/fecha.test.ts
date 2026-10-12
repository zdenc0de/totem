import { describe, expect, it } from 'vitest'
import { isoLocal, selloArchivo } from './fecha'

describe('isoLocal', () => {
  const d = new Date(2026, 9, 18, 9, 5, 3)

  it('usa la hora local con su desfase', () => {
    expect(isoLocal(d)).toMatch(/^2026-10-18T09:05:03[+-]\d{2}:\d{2}$/)
  })

  it('representa el mismo instante', () => {
    expect(new Date(isoLocal(d)).getTime()).toBe(d.getTime())
  })
})

describe('selloArchivo', () => {
  it('da YYYY-MM-DD_HHmm en hora local', () => {
    expect(selloArchivo(new Date(2026, 9, 18, 9, 5, 3))).toBe('2026-10-18_0905')
  })
})
