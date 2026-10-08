import { Mosaico } from '../components/Mosaico'
import logoConaip from '../../../assets/logos/conaip.svg'
import logoEliot from '../../../assets/logos/elliot_svg.svg'
import type { ScreenProps } from './types'

// Atractor: toda la pantalla es el botón. Lo único que se mueve es el mosaico.
export function Idle({ dispatch }: ScreenProps): React.JSX.Element {
  return (
    <div
      className="pantalla idle"
      onPointerDown={() => dispatch({ type: 'INICIAR', ahoraMs: Date.now() })}
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
    </div>
  )
}
