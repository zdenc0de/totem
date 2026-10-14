import { useEffect, useState } from 'react'
import { barajarOpciones } from '@shared/quiz'
import { Mosaico } from '../components/Mosaico'
import logoConaip from '../../../assets/logos/conaip.svg'
import logoEliot from '../../../assets/logos/elliot_svg.svg'
import type { ScreenProps } from './types'

// Atractor: toda la pantalla es el botón. Lo único que se mueve es el mosaico.
export function Idle({ dispatch }: ScreenProps): React.JSX.Element {
  const alerta = useAlertaSistema()
  return (
    <div
      className="pantalla idle"
      onPointerDown={() =>
        dispatch({ type: 'INICIAR', ahoraMs: Date.now(), ordenOpciones: barajarOpciones() })
      }
    >
      <Mosaico />
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
        5 preguntas deciden tu reto: simulador de carreras o pera de box.
      </p>
      <p className="idle__accion">Toca para comenzar</p>
      {alerta && <span className="idle__alerta" aria-hidden="true" />}
    </div>
  )
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
