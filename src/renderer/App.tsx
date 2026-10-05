import { useEffect, useReducer } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Stage } from './components/Stage'
import { HotCorner } from './components/HotCorner'
import { DevNav } from './components/DevNav'
import { ESTADO_INICIAL, flowReducer, Pantalla } from './state/flow'
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
  const [state, dispatch] = useReducer(flowReducer, ESTADO_INICIAL)
  const Actual = PANTALLAS[state.pantalla]

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

  return (
    <Stage>
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
      {import.meta.env.DEV && <DevNav actual={state.pantalla} dispatch={dispatch} />}
    </Stage>
  )
}
