import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { barajarOpciones } from '@shared/quiz'
import { BordeBanda, Mosaico } from '../components/Mosaico'
import { EscenaPera, EscenaSimulador } from '../components/Retos'
import logoConaip from '../../../assets/logos/conaip.svg'
import logoEliot from '../../../assets/logos/elliot_svg.svg'
import type { ScreenProps } from './types'

// Atractor: toda la pantalla es el botón. Para que el stand se vea vivo aunque nadie esté
// jugando, la zona central alterna en loop el mosaico de marca y los dos retos en acción.
const ESCENAS = [
  { id: 'mosaico', ms: 7000 },
  { id: 'simulador', ms: 6000 },
  { id: 'pera', ms: 6000 }
] as const

type Escena = (typeof ESCENAS)[number]['id']

export function Idle({ dispatch }: ScreenProps): React.JSX.Element {
  const alerta = useAlertaSistema()
  const escena = useCicloEscenas()
  return (
    <div
      className="pantalla idle"
      onPointerDown={() =>
        dispatch({ type: 'INICIAR', ahoraMs: Date.now(), ordenOpciones: barajarOpciones() })
      }
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={escena}
          className="idle__escena"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {escena === 'mosaico' && <Mosaico />}
          {escena === 'simulador' && <EscenaSimulador />}
          {escena === 'pera' && <EscenaPera />}
        </motion.div>
      </AnimatePresence>
      <BordeBanda />
      <div className="idle__logos">
        <img className="idle__logo-conaip" src={logoConaip} alt="CONAIP" />
        <span className="idle__logos-division" />
        <img className="idle__logo-eliot" src={logoEliot} alt="Eliot Awards" />
      </div>
      <h1 className="idle__titulo">
        Descubre tu
        <br />
        talento y
        <br />
        acepta el reto
      </h1>
      <p className="idle__bajada">
        5 preguntas deciden tu reto:{' '}
        <span className={juegoActivo(escena, 'simulador')}>simulador de carreras</span> o{' '}
        <span className={juegoActivo(escena, 'pera')}>pera de box</span>.
      </p>
      <p className="idle__accion">Toca para comenzar</p>
      {alerta && <span className="idle__alerta" aria-hidden="true" />}
    </div>
  )
}

const juegoActivo = (escena: Escena, juego: Escena): string =>
  escena === juego ? 'idle__juego idle__juego--activo' : 'idle__juego'

/** Escena actual del loop; avanza sola mientras IDLE está en pantalla. */
function useCicloEscenas(): Escena {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setI((n) => (n + 1) % ESCENAS.length), ESCENAS[i].ms)
    return () => clearTimeout(t)
  }, [i])
  return ESCENAS[i].id
}

/**
 * Punto discreto para el staff: sin USB de respaldo, la USB falla o un registro no se guardó.
 * El detalle está en el panel admin. Se revisa cada 10 s mientras la pantalla está en IDLE.
 */
function useAlertaSistema(): boolean {
  const [alerta, setAlerta] = useState(false)
  useEffect(() => {
    const revisar = (): void =>
      void window.totem
        .alertaSistema()
        .then(setAlerta)
        .catch(() => setAlerta(true))
    revisar()
    const t = setInterval(revisar, 10_000)
    return () => clearInterval(t)
  }, [])
  return alerta
}
