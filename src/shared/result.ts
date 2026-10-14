// Lógica pura del resultado (CLAUDE.md §6). Las reglas vienen de content.json (§12).
import type { Juego, Talento } from './types'

export const TALENTOS: readonly Talento[] = ['A', 'I', 'V']
export const NUM_PREGUNTAS = 5

export type Reglas = {
  juegoPorTalento: { A: Juego; I: Juego }
  /** Juego al que cuenta cada pregunta respondida con V. Índice 0 = pregunta 1. */
  reflejoPorPregunta: Juego[]
  empateReflejo: Juego
}

export type Resultado = {
  conteo: Record<Talento, number>
  talento: Talento
  juego: Juego
  desempate: boolean
}

export function esRespuestas(valor: unknown): valor is Talento[] {
  return (
    Array.isArray(valor) &&
    valor.length === NUM_PREGUNTAS &&
    valor.every((r) => (TALENTOS as unknown[]).includes(r))
  )
}

export function calcularResultado(respuestas: Talento[], reglas: Reglas): Resultado {
  const conteo: Record<Talento, number> = { A: 0, I: 0, V: 0 }
  for (const r of respuestas) conteo[r]++

  // Máximo único → ese talento; empate en el máximo (2-2-1) → V (Reflejo).
  const max = Math.max(conteo.A, conteo.I, conteo.V)
  const lideres = TALENTOS.filter((t) => conteo[t] === max)
  const desempate = lideres.length > 1
  const talento = desempate ? 'V' : lideres[0]

  const juego = talento === 'V' ? juegoReflejo(respuestas, reglas) : reglas.juegoPorTalento[talento]
  return { conteo, talento, juego, desempate }
}

/** Gana el juego con más preguntas respondidas con V; empate → `empateReflejo`. */
function juegoReflejo(respuestas: Talento[], reglas: Reglas): Juego {
  const votos: Record<Juego, number> = { simulador: 0, pera: 0 }
  respuestas.forEach((r, i) => {
    if (r === 'V') votos[reglas.reflejoPorPregunta[i]]++
  })
  if (votos.simulador === votos.pera) return reglas.empateReflejo
  return votos.simulador > votos.pera ? 'simulador' : 'pera'
}
