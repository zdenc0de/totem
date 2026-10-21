import { describe, expect, it } from 'vitest'
import { figura } from './figura'

describe('figura', () => {
  it('pinta los trazos en orden: lo último tapa a lo anterior', () => {
    const f = figura(3, 2, [
      ['rojo', 0, 0, 3, 2],
      ['amarillo', 1, 0, 1, 2]
    ])
    expect(f.celdas).toEqual([
      [0, 0, 'rojo'],
      [1, 0, 'amarillo'],
      [2, 0, 'rojo'],
      [0, 1, 'rojo'],
      [1, 1, 'amarillo'],
      [2, 1, 'rojo']
    ])
  })

  it('ignora lo que se sale del lienzo y deja vacías las celdas sin pintar', () => {
    const f = figura(2, 2, [['negro', 1, 1, 5, 5]])
    expect(f.celdas).toEqual([[1, 1, 'negro']])
  })
})
