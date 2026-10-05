import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { ScreenProps } from './types'

const DURACION_MS = 1500

export function Calculando({ dispatch }: ScreenProps): React.JSX.Element {
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'CALCULO_TERMINADO' }), DURACION_MS)
    return () => clearTimeout(t)
  }, [dispatch])

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
