// Lógica pura del resultado (CLAUDE.md §6). Las reglas vienen de content.json (§12).
import type { Juego, Talento } from './types'

export const TALENTOS: readonly Talento[] = ['A', 'I', 'V']
export const NUM_PREGUNTAS = 5

/** Cada talento lleva siempre al mismo juego (Reflejo → simulador, confirmado por el cliente). */
export type Reglas = {
  juegoPorTalento: Record<Talento, Juego>
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

  return { conteo, talento, juego: reglas.juegoPorTalento[talento], desempate }
}
