import { useRef } from 'react'

const TOQUES = 5
const VENTANA_MS = 3000

/**
 * Zona invisible en la esquina superior izquierda: 5 toques en menos de 3 s
 * disparan `onActivar` (acceso al panel admin, CLAUDE.md §11).
 */
export function HotCorner({ onActivar }: { onActivar: () => void }): React.JSX.Element {
  const toques = useRef<number[]>([])

  const onPointerDown = (e: React.PointerEvent): void => {
    // Que el toque no cuente como "Toca para comenzar".
    e.stopPropagation()
    const ahora = performance.now()
    toques.current = [...toques.current.filter((t) => ahora - t < VENTANA_MS), ahora]
    if (toques.current.length >= TOQUES) {
      toques.current = []
      onActivar()
    }
  }

  return (
    <div
      onPointerDown={onPointerDown}
      style={{ position: 'absolute', left: 0, top: 0, width: 160, height: 160, zIndex: 50 }}
    />
  )
}
