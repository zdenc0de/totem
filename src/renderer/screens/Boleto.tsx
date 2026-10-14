import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { primerNombre } from '@shared/nombre'
import { useContenido } from '../state/contenido'
import { Ticket } from '../components/Ticket'
import type { ScreenProps } from './types'

// Resultado (CLAUDE.md §7). Vuelve solo a IDLE a los `boletoSeg` segundos o al tocar "Terminar";
// el botón se va vaciando y muestra los segundos que faltan.
export function Boleto({ state, dispatch }: ScreenProps): React.JSX.Element {
  const { talentos, juegos, qr, tiempos, showGameOnTicket } = useContenido()
  const [restante, setRestante] = useState(tiempos.boletoSeg)

  useEffect(() => {
    const fin = Date.now() + tiempos.boletoSeg * 1000
    const reloj = setInterval(() => {
      const queda = Math.ceil((fin - Date.now()) / 1000)
      if (queda <= 0) dispatch({ type: 'REINICIAR' })
      else setRestante(queda)
    }, 250)
    return () => clearInterval(reloj)
  }, [tiempos.boletoSeg, dispatch])

  const resultado = state.resultado
  if (!resultado) return <div className="pantalla boleto" />
  const talento = talentos[resultado.talento]

  return (
    <div className="pantalla boleto">
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      >
        <Ticket
          nombre={primerNombre(state.registro?.nombre ?? '')}
          talento={talento.nombre}
          frase={talento.frase}
          qr={qr[resultado.talento]}
          juego={showGameOnTicket ? juegos[resultado.juego].nombre : undefined}
        />
      </motion.div>

      <button className="boton boleto__terminar" onClick={() => dispatch({ type: 'REINICIAR' })}>
        <span
          className="boleto__terminar-tiempo"
          style={{ animationDuration: `${tiempos.boletoSeg}s` }}
          aria-hidden="true"
        />
        <span className="boleto__terminar-texto">Terminar ({restante})</span>
      </button>
    </div>
  )
}
