import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { calcularResultado, type Resultado } from '@shared/result'
import { useContenido } from '../state/contenido'
import type { ScreenProps } from './types'

const DURACION_MS = 1500

// Aquí se guarda el registro (§4: solo al completar el quiz). La animación dura lo que tarde más
// entre el guardado y 1.5 s. Si main no responde, el resultado se calcula aquí y el
// participante ve su boleto igual.
export function Calculando({ state, dispatch }: ScreenProps): React.JSX.Element {
  const { reglas } = useContenido()
  // Una sola llamada aunque StrictMode monte el efecto dos veces en desarrollo.
  const guardado = useRef<Promise<Resultado> | null>(null)

  useEffect(() => {
    const local = (): Resultado => calcularResultado(state.respuestas, reglas)
    if (!guardado.current) {
      guardado.current = state.registro
        ? window.totem
            .guardarRegistro({
              campos: state.registro,
              respuestas: state.respuestas,
              duracionSeg: state.inicioMs ? (Date.now() - state.inicioMs) / 1000 : 0
            })
            .then((r) => r.resultado ?? local())
            .catch(local)
        : Promise.resolve(local())
    }
    let vigente = true
    const espera = new Promise((listo) => setTimeout(listo, DURACION_MS))
    Promise.all([guardado.current, espera]).then(([resultado]) => {
      if (vigente) dispatch({ type: 'CALCULO_TERMINADO', resultado })
    })
    return () => {
      vigente = false
    }
  }, [state.registro, state.respuestas, state.inicioMs, reglas, dispatch])

  return (
    <div className="pantalla" style={{ justifyContent: 'center', alignItems: 'center', gap: 80 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          border: '20px solid rgba(255,255,255,0.2)',
          borderTopColor: 'var(--dorado)'
        }}
      />
      <p style={{ fontSize: 56, fontWeight: 700 }}>Descubriendo tu talento…</p>
    </div>
  )
}
