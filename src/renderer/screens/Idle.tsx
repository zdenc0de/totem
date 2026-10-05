import { motion } from 'framer-motion'
import type { ScreenProps } from './types'

// PROVISIONAL (Fase 3: atractor animado con identidad visual).
export function Idle({ dispatch }: ScreenProps): React.JSX.Element {
  return (
    <div
      className="pantalla"
      onPointerDown={() => dispatch({ type: 'INICIAR', ahoraMs: Date.now() })}
      style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 64 }}
    >
      <p style={{ fontSize: 40, fontWeight: 600, color: 'var(--texto-suave)' }}>
        CONAIP × Eliot Awards
      </p>
      <h1 style={{ fontSize: 112, fontWeight: 800, lineHeight: 1.05 }}>
        Descubre tu
        <br />
        tipo de talento
      </h1>
      <motion.p
        animate={{ opacity: [1, 0.35, 1], scale: [1, 1.04, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          marginTop: 120,
          fontSize: 52,
          fontWeight: 700,
          padding: '32px 72px',
          borderRadius: 999,
          background: 'var(--rojo)'
        }}
      >
        Toca para comenzar
      </motion.p>
    </div>
  )
}
