// Escenas de IDLE con los dos retos en acción (atractor del stand). Todo es píxel del lenguaje
// de Eliot y se anima solo con transform y opacity (global.css, sección "Retos en acción").
// Las coordenadas son px del artboard dentro de la zona central de IDLE (.retos).
import type { CSSProperties } from 'react'
import { figura } from './figura'
import { Sprite } from './Sprite'

const R = 'var(--rojo)'
const Y = 'var(--amarillo-x)'
const W = 'var(--blanco)'
const K = 'var(--negro)'
const G = 'var(--negro-80)'

// Coche de carreras de perfil, mirando a la derecha (sin ruedas: van aparte para girar).
const COCHE = figura(37, 11, [
  [R, 1, 2, 5, 2], // alerón trasero
  [K, 3, 4, 2, 2], // soporte del alerón
  [R, 11, 4, 11, 1], // cubierta de la cabina
  [R, 8, 5, 19, 1],
  [R, 1, 6, 30, 3], // carrocería
  [R, 31, 7, 4, 2], // nariz
  [R, 2, 9, 33, 1],
  [Y, 2, 7, 29, 1], // franja amarilla
  [Y, 21, 6, 2, 1], // rayos, como los del coche del boleto
  [Y, 25, 6, 2, 1],
  [Y, 20, 8, 2, 1],
  [Y, 24, 8, 2, 1],
  [W, 11, 6, 5, 3], // placa del número 7
  [K, 12, 6, 3, 1],
  [K, 14, 7, 1, 1],
  [K, 13, 8, 1, 1],
  [Y, 14, 1, 4, 3], // casco
  [R, 14, 1, 1, 3],
  [K, 16, 2, 2, 1], // visera
  [K, 3, 10, 33, 1], // fondo plano
  [K, 34, 8, 3, 2] // alerón delantero
])

const RUEDA = figura(8, 8, [
  [K, 2, 0, 4, 1],
  [K, 1, 1, 6, 1],
  [K, 0, 2, 8, 4],
  [K, 1, 6, 6, 1],
  [K, 2, 7, 4, 1],
  [G, 2, 2, 4, 4], // rin
  [W, 3, 3, 2, 2],
  [Y, 3, 1, 2, 1] // marca para que se note que gira
])

// Bandera a cuadros.
const BANDERA = figura(
  9,
  6,
  Array.from({ length: 54 }, (_, i): [string, number, number, number, number] => {
    const x = i % 9
    const y = Math.floor(i / 9)
    return [(x + y) % 2 ? K : W, x, y, 1, 1]
  })
)

// Pera de box colgando de su cadena (el giro es desde el centro de arriba).
const PERA = figura(12, 20, [
  [G, 5, 0, 2, 4], // cadena
  [K, 4, 4, 4, 1], // remate
  [R, 4, 5, 4, 1],
  [R, 3, 6, 6, 1],
  [R, 2, 7, 8, 1],
  [R, 1, 8, 10, 6],
  [R, 2, 14, 8, 2],
  [R, 3, 16, 6, 1],
  [R, 4, 17, 4, 1],
  [Y, 1, 11, 10, 1], // banda amarilla
  [W, 3, 8, 1, 2], // brillo
  [W, 4, 7, 1, 1]
])

// Soporte en el techo del que cuelga la pera (no se mueve).
const SOPORTE = figura(16, 2, [
  [G, 0, 0, 16, 1],
  [K, 6, 1, 4, 1]
])

// Guante de box de perfil, golpeando hacia la derecha: puño de tela, pulgar y nudillos.
const GUANTE = figura(14, 10, [
  [R, 5, 0, 6, 1],
  [R, 3, 1, 10, 1],
  [R, 2, 2, 12, 4],
  [R, 2, 6, 11, 1],
  [R, 2, 7, 10, 1],
  [R, 3, 8, 8, 1],
  [R, 4, 9, 6, 1],
  [K, 6, 6, 6, 1], // costura del pulgar
  [W, 6, 1, 3, 1], // brillo
  [W, 0, 3, 2, 5], // puño de tela
  [K, 0, 4, 1, 1], // cordón
  [K, 0, 6, 1, 1]
])

// Destello del golpe.
const GOLPE = figura(9, 9, [
  [Y, 4, 0, 1, 3],
  [Y, 4, 6, 1, 3],
  [Y, 0, 4, 3, 1],
  [Y, 6, 4, 3, 1],
  [W, 4, 3, 1, 3],
  [W, 3, 4, 3, 1],
  [Y, 1, 1, 1, 1],
  [Y, 7, 1, 1, 1],
  [Y, 1, 7, 1, 1],
  [Y, 7, 7, 1, 1]
])

const CELDA = 20

function Nombre({ texto }: { texto: string }): React.JSX.Element {
  return (
    <p className="retos__nombre" data-texto={texto}>
      {texto}
    </p>
  )
}

export function EscenaSimulador(): React.JSX.Element {
  return (
    <div className="retos retos--simulador" aria-hidden="true">
      {/* Líneas de velocidad y la pista que corre bajo el coche. */}
      <div className="retos__pista">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className="retos__raya" style={{ left: i * 120 }} />
        ))}
      </div>
      <div className="retos__bandera">
        <span className="retos__asta" />
        <Sprite forma={BANDERA} celda={22} className="retos__bandera-tela" />
      </div>
      <div className="retos__coche">
        <div className="retos__rebote">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="retos__velocidad"
              style={{ top: 70 + i * 34, '--i': i } as CSSProperties}
            />
          ))}
          <Sprite forma={COCHE} celda={CELDA} />
          <Sprite forma={RUEDA} celda={CELDA} className="retos__rueda retos__rueda--trasera" />
          <Sprite forma={RUEDA} celda={CELDA} className="retos__rueda retos__rueda--delantera" />
        </div>
      </div>
      <Nombre texto="¡Simulador de carreras!" />
    </div>
  )
}

export function EscenaPera(): React.JSX.Element {
  return (
    <div className="retos retos--pera" aria-hidden="true">
      <Sprite forma={SOPORTE} celda={30} className="retos__soporte" />
      <div className="retos__pera">
        <Sprite forma={PERA} celda={30} />
      </div>
      <Sprite forma={GOLPE} celda={18} className="retos__golpe" />
      <div className="retos__guante">
        {[0, 1, 2].map((i) => (
          <span key={i} className="retos__estela" style={{ top: 50 + i * 50 }} />
        ))}
        <Sprite forma={GUANTE} celda={22} />
      </div>
      <Nombre texto="¡Pera de box!" />
    </div>
  )
}
