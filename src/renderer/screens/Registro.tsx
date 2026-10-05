import type { ScreenProps } from './types'

// PROVISIONAL (Fase 2: formulario, validaciones, teclado en pantalla y aviso de privacidad).
export function Registro({ dispatch }: ScreenProps): React.JSX.Element {
  return (
    <div className="pantalla" style={{ gap: 48 }}>
      <h2 style={{ fontSize: 80, fontWeight: 800, marginTop: 120 }}>Regístrate</h2>
      <p style={{ fontSize: 40, color: 'var(--texto-suave)' }}>
        Aquí irán nombre, correo, teléfono, aviso de privacidad y el teclado en pantalla.
      </p>
      <div style={{ flex: 1 }} />
      <button
        className="boton"
        onClick={() =>
          dispatch({
            type: 'ENVIAR_REGISTRO',
            datos: {
              nombre: 'Participante Demo',
              email: 'demo@ejemplo.com',
              telefono: '5512345678',
              aceptoPrivacidad: true
            }
          })
        }
      >
        Continuar
      </button>
      <button className="boton boton--secundario" onClick={() => dispatch({ type: 'REINICIAR' })}>
        Cancelar
      </button>
    </div>
  )
}
