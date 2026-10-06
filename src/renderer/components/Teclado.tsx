import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DISENOS, type DisenoTeclado, type Tecla as DefTecla } from './teclas'

type Props = {
  diseno: DisenoTeclado
  /** Texto de la tecla de acción, p. ej. "Siguiente" o "Listo". */
  accion: string
  /** Mayúscula automática; la tecla ⇧ la invierte para la siguiente letra. */
  mayusculas?: boolean
  onTexto: (texto: string) => void
  onBorrar: () => void
  onAccion: () => void
}

// Mantener presionado "borrar" repite, como en un teclado normal.
const REPETIR_TRAS_MS = 450
const REPETIR_CADA_MS = 70

// Teclado propio: el del sistema no se usa en el tótem (CLAUDE.md §10).
export function Teclado(props: Props): React.JSX.Element {
  const { diseno, accion, mayusculas = false, onTexto, onBorrar, onAccion } = props
  const [shift, setShift] = useState(false)
  const mayus = mayusculas !== shift

  function pulsar(tecla: DefTecla): void {
    switch (tecla.tipo) {
      case 'texto':
        onTexto(mayus ? tecla.valor.toUpperCase() : tecla.valor)
        return setShift(false)
      case 'espacio':
        onTexto(' ')
        return setShift(false)
      case 'mayus':
        return setShift((s) => !s)
      case 'borrar':
        return onBorrar()
      case 'accion':
        return onAccion()
    }
  }

  return (
    <div
      className={`teclado teclado--${diseno}`}
      // Tocar el teclado no le quita el foco (ni el cursor) al campo que se está editando.
      onPointerDown={(e) => e.preventDefault()}
      onMouseDown={(e) => e.preventDefault()}
    >
      {DISENOS[diseno].map((fila, i) => (
        <div key={i} className="teclado__fila">
          {fila.map((tecla, j) => (
            <Tecla
              key={j}
              ancho={tecla.ancho ?? 1}
              {...apariencia(tecla, mayus, accion)}
              onPulsar={() => pulsar(tecla)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

type Apariencia = {
  variante?: 'atajo' | 'especial' | 'accion'
  etiqueta?: string
  activa?: boolean
  repetir?: boolean
  children: ReactNode
}

function apariencia(tecla: DefTecla, mayus: boolean, accion: string): Apariencia {
  switch (tecla.tipo) {
    case 'texto': {
      const texto = mayus ? tecla.valor.toUpperCase() : tecla.valor
      return { variante: texto.length > 1 ? 'atajo' : undefined, children: texto }
    }
    case 'espacio':
      return { children: 'espacio' }
    case 'mayus':
      return { variante: 'especial', etiqueta: 'Mayúsculas', activa: mayus, children: ICONO_MAYUS }
    case 'borrar':
      return { variante: 'especial', etiqueta: 'Borrar', repetir: true, children: ICONO_BORRAR }
    case 'accion':
      return { variante: 'accion', children: accion }
  }
}

const ICONO_MAYUS = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4l8 8h-4.5v7h-7v-7H4z" />
  </svg>
)

const ICONO_BORRAR = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 5H8.5L2 12l6.5 7H21z M16.5 9l-6 6 M10.5 9l6 6" />
  </svg>
)

type TeclaProps = Apariencia & { ancho: number; onPulsar: () => void }

function Tecla(props: TeclaProps): React.JSX.Element {
  const { ancho, variante, etiqueta, activa, repetir, onPulsar, children } = props
  // El estado "presionada" es propio: con preventDefault, :active no es confiable en táctil.
  const [presionada, setPresionada] = useState(false)
  const repeticion = useRef<number | null>(null)

  const detener = (): void => {
    if (repeticion.current !== null) window.clearTimeout(repeticion.current)
    repeticion.current = null
  }
  const soltar = (): void => {
    setPresionada(false)
    detener()
  }
  useEffect(() => detener, [])

  const repetirCada = (ms: number): void => {
    repeticion.current = window.setTimeout(() => {
      onPulsar()
      repetirCada(REPETIR_CADA_MS)
    }, ms)
  }

  const clases = ['tecla']
  if (variante) clases.push(`tecla--${variante}`)
  if (activa) clases.push('tecla--activa')
  if (presionada) clases.push('tecla--presionada')

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={etiqueta}
      className={clases.join(' ')}
      style={{ flex: ancho }}
      // Se escribe al apoyar el dedo, no al soltarlo: respuesta inmediata.
      onPointerDown={(e) => {
        if (e.button !== 0) return
        setPresionada(true)
        onPulsar()
        if (repetir) {
          detener()
          repetirCada(REPETIR_TRAS_MS)
        }
      }}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
    >
      {children}
    </button>
  )
}
