import { ReactNode, useEffect, useState } from 'react'

const ANCHO = 1080
const ALTO = 1920

type Ajuste = { escala: number; x: number; y: number }

function calcularAjuste(): Ajuste {
  const escala = Math.min(window.innerWidth / ANCHO, window.innerHeight / ALTO)
  return {
    escala,
    x: (window.innerWidth - ANCHO * escala) / 2,
    y: (window.innerHeight - ALTO * escala) / 2
  }
}

/**
 * Artboard fijo de 1080×1920 escalado con transform para llenar cualquier
 * pantalla vertical (letterbox). Todo el diseño se hace en px del artboard,
 * así el escalado DPI de Windows no altera el layout.
 */
export function Stage({ children }: { children: ReactNode }): React.JSX.Element {
  const [ajuste, setAjuste] = useState(calcularAjuste)

  useEffect(() => {
    const onResize = (): void => setAjuste(calcularAjuste())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: ANCHO,
        height: ALTO,
        overflow: 'hidden',
        transformOrigin: '0 0',
        transform: `translate(${ajuste.x}px, ${ajuste.y}px) scale(${ajuste.escala})`,
        background: 'var(--azul)'
      }}
    >
      {children}
    </div>
  )
}
