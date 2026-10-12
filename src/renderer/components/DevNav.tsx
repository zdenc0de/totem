import type { Dispatch } from 'react'
import type { ConfigRenderer } from '@shared/content'
import type { FlowAction, Pantalla } from '../state/flow'
import { estadoDev } from '../state/dev'

const TODAS: Pantalla[] = ['idle', 'registro', 'quiz', 'calculando', 'boleto', 'admin']

/** Barra para saltar entre pantallas. Solo existe en desarrollo (no se empaqueta). */
export function DevNav({
  actual,
  config,
  dispatch
}: {
  actual: Pantalla
  config: ConfigRenderer
  dispatch: Dispatch<FlowAction>
}): React.JSX.Element {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        right: 16,
        bottom: 16,
        display: 'flex',
        gap: 8,
        zIndex: 100,
        opacity: 0.6
      }}
    >
      {TODAS.map((p) => (
        <button
          key={p}
          onClick={() => dispatch({ type: 'DEV_IR', estado: estadoDev(p, config) })}
          style={{
            fontSize: 20,
            padding: '8px 14px',
            borderRadius: 8,
            background: p === actual ? 'var(--dorado)' : 'rgba(0,0,0,0.6)',
            color: p === actual ? 'var(--negro)' : 'var(--blanco)'
          }}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
