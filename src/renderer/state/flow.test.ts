import { describe, expect, it } from 'vitest'
import type { Talento } from '@shared/types'
import { barajarOpciones } from '@shared/quiz'
import { ESTADO_INICIAL, flowReducer, type FlowAction, type FlowState } from './flow'

const DATOS = {
  nombre: 'Zdenko',
  apellido: 'Núñez',
  email: 'zdenko@correo.com',
  telefono: '5512345678',
  aceptoPrivacidad: true
}
const ORDEN = barajarOpciones()
const RESULTADO = {
  conteo: { A: 3, I: 1, V: 1 },
  talento: 'A',
  juego: 'simulador',
  desempate: false
} as const

const correr = (acciones: FlowAction[], desde: FlowState = ESTADO_INICIAL): FlowState =>
  acciones.reduce(flowReducer, desde)
const responder = (...ts: Talento[]): FlowAction[] =>
  ts.map((talento) => ({ type: 'RESPONDER', talento }))

const hastaBoleto: FlowAction[] = [
  { type: 'INICIAR', ahoraMs: 1000, ordenOpciones: ORDEN },
  { type: 'ENVIAR_REGISTRO', datos: DATOS },
  ...responder('A', 'A', 'A', 'I', 'V'),
  { type: 'CALCULO_TERMINADO', resultado: { ...RESULTADO, conteo: { ...RESULTADO.conteo } } }
]

describe('flowReducer', () => {
  it('recorre IDLE → REGISTRO → QUIZ → CALCULANDO → BOLETO', () => {
    const s = correr(hastaBoleto)
    expect(s.pantalla).toBe('boleto')
    expect(s.registro).toEqual(DATOS)
    expect(s.respuestas).toEqual(['A', 'A', 'A', 'I', 'V'])
    expect(s.ordenOpciones).toBe(ORDEN)
    expect(s.resultado?.talento).toBe('A')
  })

  it.each([['REINICIAR'], ['CERRAR_ADMIN']] as const)(
    '%s no deja ningún dato del participante',
    (type) => {
      expect(correr([...hastaBoleto, { type }])).toEqual(ESTADO_INICIAL)
    }
  )

  it('el abandono a medio quiz también se borra por completo', () => {
    const s = correr([...hastaBoleto.slice(0, 4), { type: 'REINICIAR' }])
    expect(s).toEqual(ESTADO_INICIAL)
  })

  it('"Atrás" conserva las respuestas y el orden; desde la pregunta 1 vuelve a REGISTRO', () => {
    const enQ3 = correr(hastaBoleto.slice(0, 4))
    expect(enQ3.preguntaActual).toBe(2)
    const atras = correr([{ type: 'ATRAS' }], enQ3)
    expect(atras.preguntaActual).toBe(1)
    expect(atras.respuestas).toEqual(['A', 'A'])
    expect(atras.ordenOpciones).toBe(ORDEN)
    // Cambiar la respuesta de la pregunta 2 descarta las posteriores.
    expect(correr(responder('V'), atras).respuestas).toEqual(['A', 'V'])
    expect(correr([{ type: 'ATRAS' }, { type: 'ATRAS' }], atras).pantalla).toBe('registro')
  })

  it('ignora acciones fuera de su pantalla (toques erráticos)', () => {
    const boleto = correr(hastaBoleto)
    for (const a of [
      { type: 'INICIAR', ahoraMs: 0, ordenOpciones: [] },
      { type: 'RESPONDER', talento: 'V' },
      { type: 'ATRAS' },
      { type: 'ABRIR_ADMIN' }
    ] as FlowAction[]) {
      expect(flowReducer(boleto, a)).toBe(boleto)
    }
  })
})

describe('barajarOpciones', () => {
  it('da una permutación de A, I y V por pregunta', () => {
    for (let i = 0; i < 50; i++) {
      const orden = barajarOpciones()
      expect(orden).toHaveLength(5)
      for (const o of orden) expect([...o].sort()).toEqual(['A', 'I', 'V'])
    }
  })

  it('con el mismo generador da el mismo orden', () => {
    const fijo = (): (() => number) => {
      let x = 0.1
      return () => (x = (x * 9301 + 0.49297) % 1)
    }
    expect(barajarOpciones(fijo())).toEqual(barajarOpciones(fijo()))
  })
})
