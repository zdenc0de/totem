import { describe, expect, it } from 'vitest'
import { TEXTO_PRIVACIDAD, bloquesAviso } from './privacidad'

describe('bloquesAviso', () => {
  it('separa títulos, párrafos y listas', () => {
    const texto = '## Título\n\nUn párrafo\ncon dos líneas.\n\n- Uno\n- Dos'
    expect(bloquesAviso(texto)).toEqual([
      { tipo: 'titulo', texto: 'Título' },
      { tipo: 'parrafo', texto: 'Un párrafo\ncon dos líneas.' },
      { tipo: 'lista', items: ['Uno', 'Dos'] }
    ])
  })

  it('ignora líneas en blanco de más y un texto vacío no da bloques', () => {
    expect(bloquesAviso('\n\nHola\n\n\n\n')).toEqual([{ tipo: 'parrafo', texto: 'Hola' }])
    expect(bloquesAviso('')).toEqual([])
  })

  it('el aviso de CONAIP empieza con un título y no deja marcas sin interpretar', () => {
    const bloques = bloquesAviso(TEXTO_PRIVACIDAD)
    expect(bloques[0]).toEqual({ tipo: 'titulo', texto: 'Responsable de sus datos' })
    const textos = bloques.flatMap((b) => (b.tipo === 'lista' ? b.items : [b.texto]))
    expect(textos.some((t) => /^(##|- )/m.test(t))).toBe(false)
  })
})
