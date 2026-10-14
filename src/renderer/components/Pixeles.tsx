import type { CSSProperties } from 'react'

// Cuadros del lenguaje de mosaico de Eliot. IDLE (Mosaico.tsx) y el boleto (Ticket.tsx) arman
// cada uno su composición y comparten este render y la animación de global.css (.mosaico).

export type TipoCuadro = 'trama' | 'pixel' | 'brillo' | 'paloma' | 'franja' | 'borde'

export type Cuadro = {
  /** Centro y lado, en px del contenedor. */
  x: number
  y: number
  lado: number
  color: string
  tipo: TipoCuadro
  /** ms para aparecer en la entrada. */
  retraso: number
  /** Distancia normalizada al origen de la trama (0 a ~1.5): desfasa la onda del latido. */
  d: number
}

export function Pixeles({ cuadros }: { cuadros: Cuadro[] }): React.JSX.Element {
  return (
    <div className="mosaico" aria-hidden="true">
      {cuadros.map(({ x, y, lado, color, tipo, retraso, d }) => (
        <span
          key={`${x},${y}`}
          className={`mosaico__cuadro mosaico__cuadro--${tipo}`}
          style={
            {
              left: x - lado / 2,
              top: y - lado / 2,
              width: lado,
              height: lado,
              background: color,
              '--retraso': Math.round(retraso),
              '--d': d.toFixed(3)
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
