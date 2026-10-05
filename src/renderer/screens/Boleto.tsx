import type { ScreenProps } from './types'

// PROVISIONAL (Fase 1: resultado real; Fase 3: boleto con QR e identidad visual).
export function Boleto({ state, dispatch }: ScreenProps): React.JSX.Element {
  const primerNombre = state.registro?.nombre.split(' ')[0] ?? ''

  return (
    <div className="pantalla" style={{ alignItems: 'center', textAlign: 'center', gap: 48 }}>
      <div
        style={{
          marginTop: 80,
          width: 860,
          height: 1300,
          borderRadius: 48,
          border: '12px solid var(--dorado)',
          background: 'var(--azul-oscuro)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          padding: 64
        }}
      >
        <p style={{ fontSize: 48 }}>{primerNombre}, tu tipo de talento es</p>
        <h2 style={{ fontSize: 88, fontWeight: 800 }}>Talento …</h2>
        <div
          style={{
            width: 420,
            height: 420,
            background: 'var(--blanco)',
            borderRadius: 24,
            color: 'var(--azul)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            fontWeight: 700
          }}
        >
          QR
        </div>
        <p style={{ fontSize: 32, color: 'var(--texto-suave)' }}>
          Respuestas: {state.respuestas.join(' ')}
        </p>
      </div>
      <div style={{ flex: 1 }} />
      <button
        className="boton"
        style={{ width: 600 }}
        onClick={() => dispatch({ type: 'REINICIAR' })}
      >
        Terminar
      </button>
    </div>
  )
}
