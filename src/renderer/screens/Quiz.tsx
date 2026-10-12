import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PREGUNTAS } from '@shared/quiz'
import { TALENTOS } from '@shared/result'
import type { Talento } from '@shared/types'
import type { ScreenProps } from './types'

// Tiempo con la opción resaltada antes de pasar a la siguiente pregunta.
const RESALTE_MS = 220

export function Quiz({ state, dispatch }: ScreenProps): React.JSX.Element {
  const n = state.preguntaActual
  // Orden barajado al iniciar (§5); el orden fijo solo aplica si se entra sin pasar por IDLE.
  const orden = state.ordenOpciones[n] ?? TALENTOS

  return (
    <div className="pantalla quiz">
      <div className="quiz__progreso" aria-hidden="true">
        <div
          className="quiz__progreso-barra"
          style={{ transform: `scaleX(${(n + 1) / PREGUNTAS.length})` }}
        />
      </div>
      <p className="quiz__contador">
        Pregunta {n + 1} de {PREGUNTAS.length}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={n}
          className="quiz__pregunta"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <Pregunta
            texto={PREGUNTAS[n].texto}
            opciones={orden.map((t) => [t, PREGUNTAS[n].opciones[t]])}
            previa={state.respuestas[n]}
            onResponder={(talento) => dispatch({ type: 'RESPONDER', talento })}
          />
        </motion.div>
      </AnimatePresence>

      <div style={{ flex: 1 }} />
      <button
        className="boton boton--secundario"
        style={{ alignSelf: 'flex-start' }}
        onClick={() => dispatch({ type: 'ATRAS' })}
      >
        ← Atrás
      </button>
    </div>
  )
}

type PreguntaProps = {
  texto: string
  opciones: [Talento, string][]
  /** Respuesta que ya había dado, si volvió con "Atrás". */
  previa: Talento | undefined
  onResponder: (talento: Talento) => void
}

function Pregunta({ texto, opciones, previa, onResponder }: PreguntaProps): React.JSX.Element {
  // Al elegir, la opción se resalta un momento y los demás toques se ignoran:
  // un doble toque no puede contestar también la siguiente pregunta.
  // El ref bloquea al instante; el estado solo pinta la opción.
  const [elegida, setElegida] = useState<Talento | null>(null)
  const respondida = useRef(false)
  const marcada = elegida ?? previa

  function elegir(talento: Talento): void {
    if (respondida.current) return
    respondida.current = true
    setElegida(talento)
    setTimeout(() => onResponder(talento), RESALTE_MS)
  }

  return (
    <>
      <h2 className="quiz__texto">{texto}</h2>
      <div className="quiz__opciones">
        {opciones.map(([talento, etiqueta]) => (
          <button
            key={talento}
            className={talento === marcada ? 'quiz__opcion quiz__opcion--marcada' : 'quiz__opcion'}
            aria-pressed={talento === marcada}
            onClick={() => elegir(talento)}
          >
            {etiqueta}
          </button>
        ))}
      </div>
    </>
  )
}
