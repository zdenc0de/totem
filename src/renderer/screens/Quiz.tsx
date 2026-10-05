import { PREGUNTAS } from '@shared/quiz'
import type { Talento } from '@shared/types'
import type { ScreenProps } from './types'

const ORDEN: Talento[] = ['A', 'I', 'V']

// PROVISIONAL (Fase 2: opciones barajadas, barra de progreso animada y diseño final).
export function Quiz({ state, dispatch }: ScreenProps): React.JSX.Element {
  const n = state.preguntaActual
  const pregunta = PREGUNTAS[n]

  return (
    <div className="pantalla" style={{ gap: 40 }}>
      <div style={{ height: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 8 }}>
        <div
          style={{
            height: '100%',
            width: `${((n + 1) / PREGUNTAS.length) * 100}%`,
            background: 'var(--dorado)',
            borderRadius: 8
          }}
        />
      </div>
      <p style={{ fontSize: 36, fontWeight: 600, color: 'var(--texto-suave)' }}>
        Pregunta {n + 1} de {PREGUNTAS.length}
      </p>
      <h2 style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.15, minHeight: 340 }}>
        {pregunta.texto}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        {ORDEN.map((t) => (
          <button
            key={t}
            className="boton boton--claro"
            style={{ minHeight: 180, fontSize: 44, textAlign: 'center' }}
            onClick={() => dispatch({ type: 'RESPONDER', talento: t })}
          >
            {pregunta.opciones[t]}
          </button>
        ))}
      </div>
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
