// Dibuja una figura de píxeles (figura.ts) celda por celda, con un pequeño espacio entre cuadros
// como la trama de IDLE.

import type { Figura } from './figura'

const HUECO = 0.08 // fracción de la celda que queda libre entre cuadros

export function Sprite({
  forma,
  celda,
  className
}: {
  forma: Figura
  /** Lado de cada celda en px del artboard. */
  celda: number
  className?: string
}): React.JSX.Element {
  return (
    <svg
      className={className}
      width={forma.ancho * celda}
      height={forma.alto * celda}
      viewBox={`0 0 ${forma.ancho} ${forma.alto}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {forma.celdas.map(([x, y, color]) => (
        <rect
          key={`${x},${y}`}
          x={x + HUECO / 2}
          y={y + HUECO / 2}
          width={1 - HUECO}
          height={1 - HUECO}
          style={{ fill: color }}
        />
      ))}
    </svg>
  )
}
