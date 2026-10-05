import type { ScreenProps } from './types'

// PROVISIONAL (Fase 4: PIN, estadísticas, exportación e ID de tótem).
export function Admin({ dispatch }: ScreenProps): React.JSX.Element {
  return (
    <div className="pantalla" style={{ gap: 48, background: 'var(--negro)' }}>
      <h2 style={{ fontSize: 72, fontWeight: 800, marginTop: 80 }}>Panel de administrador</h2>
      <p style={{ fontSize: 36, color: 'var(--texto-suave)' }}>
        Estadísticas, exportación a Excel/CSV e ID de tótem llegan en la Fase 4.
      </p>
      <div style={{ flex: 1 }} />
      <button className="boton boton--claro" onClick={() => dispatch({ type: 'CERRAR_ADMIN' })}>
        Volver al quiz
      </button>
      <button className="boton" onClick={() => window.totem.admin.salir()}>
        Salir de la app
      </button>
    </div>
  )
}
