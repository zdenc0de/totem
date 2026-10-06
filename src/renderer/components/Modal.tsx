import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type Props = {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

// Solo se cierra con su botón: un toque errático en el fondo no lo descarta.
export function Modal({ abierto, titulo, onCerrar, children }: Props): React.JSX.Element {
  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="modal__tarjeta"
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.94 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="modal__titulo">{titulo}</h2>
            <div className="modal__cuerpo">{children}</div>
            <button className="boton" onClick={onCerrar}>
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
