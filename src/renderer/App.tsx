import { useEffect, useReducer, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ConfigRenderer } from '@shared/content'
import { Stage } from './components/Stage'
import { HotCorner } from './components/HotCorner'
import { DevNav } from './components/DevNav'
import { Modal } from './components/Modal'
import { ESTADO_INICIAL, flowReducer, Pantalla } from './state/flow'
import { ContenidoContext } from './state/contenido'
import { useInactividad } from './state/useInactividad'
import { estadoInicialDev } from './state/dev'
import type { ScreenProps } from './screens/types'
import { Idle } from './screens/Idle'
import { Registro } from './screens/Registro'
import { Quiz } from './screens/Quiz'
import { Calculando } from './screens/Calculando'
import { Boleto } from './screens/Boleto'
import { Admin } from './screens/Admin'

const PANTALLAS: Record<Pantalla, (p: ScreenProps) => React.JSX.Element> = {
  idle: Idle,
  registro: Registro,
  quiz: Quiz,
  calculando: Calculando,
  boleto: Boleto,
  admin: Admin
}

export default function App(): React.JSX.Element {
  // undefined: cargando; null: main no respondió (fuera de servicio).
  const [config, setConfig] = useState<ConfigRenderer | null | undefined>(undefined)

  useEffect(() => {
    const bloquear = (e: Event): void => e.preventDefault()
    const bloquearZoom = (e: WheelEvent): void => {
      if (e.ctrlKey) e.preventDefault()
    }
    window.addEventListener('contextmenu', bloquear)
    window.addEventListener('dragstart', bloquear)
    window.addEventListener('wheel', bloquearZoom, { passive: false })
    return () => {
      window.removeEventListener('contextmenu', bloquear)
      window.removeEventListener('dragstart', bloquear)
      window.removeEventListener('wheel', bloquearZoom)
    }
  }, [])

  useEffect(() => {
    window.totem
      .getConfig()
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  return (
    <Stage>
      {config === null && (
        <div className="pantalla" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ fontSize: 56, fontWeight: 700 }}>Fuera de servicio</p>
        </div>
      )}
      {config && (
        <ContenidoContext.Provider value={config}>
          <Flujo config={config} />
        </ContenidoContext.Provider>
      )}
    </Stage>
  )
}

function Flujo({ config }: { config: ConfigRenderer }): React.JSX.Element {
  const [state, dispatch] = useReducer(flowReducer, config, (c) =>
    import.meta.env.DEV ? estadoInicialDev(c) : ESTADO_INICIAL
  )
  const avisoInactividad = useInactividad(state.pantalla, config.tiempos, dispatch)
  const Actual = PANTALLAS[state.pantalla]

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state.pantalla}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Actual state={state} dispatch={dispatch} />
        </motion.div>
      </AnimatePresence>
      {state.pantalla === 'idle' && (
        <HotCorner onActivar={() => dispatch({ type: 'ABRIR_ADMIN' })} />
      )}
      {/* Cualquier toque (también el del botón) reinicia el temporizador y oculta el aviso. */}
      <Modal
        abierto={avisoInactividad !== null}
        titulo="¿Sigues ahí?"
        boton="Sí, sigo aquí"
        encima
        onCerrar={() => {}}
      >
        Volveremos al inicio en {avisoInactividad} s y se borrarán tus datos.
      </Modal>
      {import.meta.env.DEV && (
        <DevNav actual={state.pantalla} config={config} dispatch={dispatch} />
      )}
    </>
  )
}
