// Lógica pura del resultado (CLAUDE.md §6). Las reglas vienen de content.json (§12).
import type { Juego, Talento } from './types'

export const TALENTOS: readonly Talento[] = ['A', 'I', 'V']
export const NUM_PREGUNTAS = 5

/** Los empates posibles con 5 respuestas: siempre 2-2-1 entre dos talentos. */
export type ParEmpate = 'A-I' | 'A-V' | 'I-V'

/**
 * Quién gana cada empate. Impulsor (la pera, el juego más rápido) se lleva los empates en los
 * que participa; en el de Acelerador-Reflejo, gana Impulsor si su única respuesta cayó en una de
 * las preguntas de `impulsorDesempataEn` (1 a 5). Cada pregunta de la lista manda a la pera ~2.5 %
 * más de las combinaciones posibles.
 */
export type Desempate = Record<ParEmpate, Talento> & { impulsorDesempataEn: number[] }

export type Reglas = {
  /** Cada talento lleva siempre al mismo juego (Reflejo → simulador, confirmado por el cliente). */
  juegoPorTalento: Record<Talento, Juego>
  desempate: Desempate
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

  // Máximo único → ese talento; empate en el máximo (2-2-1) → según `reglas.desempate`.
  const max = Math.max(conteo.A, conteo.I, conteo.V)
  const lideres = TALENTOS.filter((t) => conteo[t] === max)
  const desempate = lideres.length > 1
  const talento = desempate
    ? desempatar(lideres.join('-') as ParEmpate, respuestas, reglas.desempate)
    : lideres[0]

  return { conteo, talento, juego: reglas.juegoPorTalento[talento], desempate }
}

function desempatar(par: ParEmpate, respuestas: Talento[], reglas: Desempate): Talento {
  if (par === 'A-V') {
    // En un empate 2-2-1 entre Acelerador y Reflejo hay exactamente una respuesta de Impulsor.
    const pregunta = respuestas.indexOf('I') + 1
    if (reglas.impulsorDesempataEn.includes(pregunta)) return 'I'
  }
  return reglas[par]
}
