import type { CSSProperties } from 'react'

// Escena de píxeles de IDLE: une las dos marcas en el lenguaje de mosaico de Eliot.
// - Rombo de trama amarilla (forma del sello "Más cerca de ti" de Eliot) que late en una onda.
// - Paloma roja al centro (el isotipo de CONAIP es un círculo cortado por una paloma).
// - Franjas rojas en diagonal, como las del boleto CONAIP × Eliot, hechas de píxeles.
// - La franja blanca de logos se deshace en píxeles hacia el azul.
// Todo va en px del artboard sobre una retícula común. Se calcula una sola vez con semilla fija,
// así la composición es siempre la misma; la animación es solo CSS (transform y opacity).

const PASO = 44 // separación de la retícula
const CX = 540 // centro del rombo (y nodo de la retícula)
const CY = 662
const MEDIA_DIAGONAL = 390 // del centro a la punta del rombo
const REDONDEZ = 7 // exponente de la superelipse: más alto = esquinas más agudas
const ALCANCE_PIXELES = 1.45 // hasta dónde llegan los píxeles sueltos (1 = orilla del rombo)
const BANDA = 200 // alto de la franja blanca de logos (ver .idle__logos)
const LIMITE_ARRIBA = BANDA + PASO * 2 // que los píxeles del rombo no tapen el borde de la banda
const LIMITE_ABAJO = CY + MEDIA_DIAGONAL + PASO / 2 // que no invadan el titular

// Paloma, en celdas de la retícula relativas al centro: brazo corto y brazo largo.
const PALOMA: [number, number][] = [
  [-4.4, -0.2],
  [-1.4, 2.8],
  [4.6, -3.8]
]
const GROSOR_PALOMA = 1.0 // radio en celdas

// Franjas rojas: de abajo hacia arriba, en px del artboard.
const FRANJAS: { desde: [number, number]; hasta: [number, number] }[] = [
  { desde: [-30, 720], hasta: [250, 220] },
  { desde: [840, 1110], hasta: [1120, 610] }
]
const GROSOR_FRANJA = 26 // radio en px

type Tipo = 'trama' | 'pixel' | 'brillo' | 'paloma' | 'franja' | 'borde'
type Cuadro = {
  x: number
  y: number
  lado: number
  color: string
  tipo: Tipo
  retraso: number
  d: number
}

const PIXELES_SOBRE_AZUL = [
  ...Array(3).fill('var(--amarillo-x)'),
  'var(--amarillo-2)',
  'var(--amarillo-4)',
  'var(--amarillo-6)',
  'var(--blanco)',
  'var(--blanco)',
  'var(--negro)',
  'var(--negro)',
  'var(--negro-80)'
]

// PRNG pequeño y determinista (mulberry32).
function aleatorio(semilla: number): () => number {
  let s = semilla
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Distancia normalizada al centro: 0 en el centro y 1 en la orilla del rombo redondeado
// (un cuadrado redondeado girado 45°).
function distanciaRombo(x: number, y: number): number {
  const u = Math.abs(x + y) / Math.SQRT2
  const v = Math.abs(x - y) / Math.SQRT2
  const radio = (MEDIA_DIAGONAL / Math.SQRT2) * 2 ** (1 / REDONDEZ)
  return (u ** REDONDEZ + v ** REDONDEZ) ** (1 / REDONDEZ) / radio
}

// Distancia de un punto a un segmento y posición (0..1) de su proyección sobre él.
function aSegmento(
  px: number,
  py: number,
  [ax, ay]: [number, number],
  [bx, by]: [number, number]
): { dist: number; t: number } {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return { dist: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t }
}

// Posición (0..1) a lo largo de la paloma si la celda (col, fila) le pertenece; si no, null.
function enPaloma(col: number, fila: number): number | null {
  const largos = [0, 1].map((k) =>
    Math.hypot(PALOMA[k + 1][0] - PALOMA[k][0], PALOMA[k + 1][1] - PALOMA[k][1])
  )
  const total = largos[0] + largos[1]
  for (const k of [0, 1]) {
    const { dist, t } = aSegmento(col, fila, PALOMA[k], PALOMA[k + 1])
    if (dist <= GROSOR_PALOMA) return (k === 0 ? t * largos[0] : largos[0] + t * largos[1]) / total
  }
  return null
}

function calcularCuadros(): Cuadro[] {
  const azar = aleatorio(22)
  const elegir = (): string => PIXELES_SOBRE_AZUL[Math.floor(azar() * PIXELES_SOBRE_AZUL.length)]
  const cuadros: Cuadro[] = []
  const ocupadas = new Set<string>()
  const agregar = (c: Cuadro): void => {
    const clave = `${c.x},${c.y}`
    if (ocupadas.has(clave)) return
    ocupadas.add(clave)
    cuadros.push(c)
  }
  const columnas = Math.ceil(CX / PASO)
  const filas = Math.ceil(1920 / PASO)

  for (let fila = -filas; fila <= filas; fila++) {
    for (let col = -columnas; col <= columnas; col++) {
      const x = CX + col * PASO
      const y = CY + fila * PASO
      if (y < -PASO || y > 1920 + PASO) continue

      // Borde de la banda blanca: se deshace en dos o tres filas de píxeles.
      const bajoBanda = (y - PASO / 2 - BANDA) / PASO // 0 = primera fila bajo la banda
      if (bajoBanda >= 0 && bajoBanda < 3) {
        const prob = [0.72, 0.28, 0.07][Math.floor(bajoBanda)]
        if (azar() < prob) {
          const color = azar() < 0.85 ? 'var(--blanco)' : 'var(--amarillo-6)'
          agregar({ x, y, lado: PASO, color, tipo: 'borde', retraso: 0, d: 0 })
          continue
        }
      }

      // Paloma roja al centro del rombo; se dibuja de un extremo al otro.
      const t = enPaloma(col, fila)
      if (t !== null) {
        agregar({
          x,
          y,
          lado: PASO - 4,
          color: 'var(--rojo)',
          tipo: 'paloma',
          retraso: 800 + t * 500,
          d: 0
        })
        continue
      }

      // Franjas rojas: aparecen de abajo hacia arriba y se deshacen en las puntas.
      let enFranja = false
      for (const [i, f] of FRANJAS.entries()) {
        const { dist, t: tf } = aSegmento(x, y, f.desde, f.hasta)
        if (dist > GROSOR_FRANJA) continue
        const punta = Math.min(tf, 1 - tf) // 0 en las puntas
        if (punta < 0.18 && azar() > punta / 0.18) continue
        const color = punta < 0.1 && azar() < 0.35 ? elegir() : 'var(--rojo)'
        agregar({
          x,
          y,
          lado: PASO,
          color,
          tipo: 'franja',
          retraso: 1200 + i * 150 + tf * 400,
          d: 0
        })
        enFranja = true
        break
      }
      if (enFranja) continue

      if (y < LIMITE_ARRIBA || y > LIMITE_ABAJO) continue
      const d = distanciaRombo(x - CX, y - CY)
      // La trama se deshace sobre todo hacia arriba a la derecha, lejos del titular.
      const dx = x - CX
      const dy = y - CY
      const sesgo = 0.15 + 0.85 * Math.max(0, (dx - dy) / Math.hypot(dx, dy) || 0) ** 2

      if (d <= 1) {
        // Cerca de la orilla, algunos cuadros de la trama ya son píxeles sueltos.
        if (d > 0.7 && azar() < ((d - 0.7) / 0.3) * 0.55 * sesgo) {
          const tipo = azar() < 0.3 ? 'brillo' : 'pixel'
          agregar({ x, y, lado: PASO, color: elegir(), tipo, retraso: d * 700, d })
          continue
        }
        // Trama: cuadros casi tocándose en el centro que se encogen hacia la orilla.
        const lado = PASO * 0.9 * (1 - d ** 2.6)
        if (lado >= 8) {
          agregar({ x, y, lado, color: 'var(--amarillo-x)', tipo: 'trama', retraso: d * 700, d })
        }
      } else if (d <= ALCANCE_PIXELES) {
        const caida = 1 - (d - 1) / (ALCANCE_PIXELES - 1)
        if (azar() < 0.55 * caida ** 1.4 * sesgo) {
          const tipo = azar() < 0.3 ? 'brillo' : 'pixel'
          agregar({ x, y, lado: PASO, color: elegir(), tipo, retraso: d * 700, d })
        }
      }
    }
  }
  return cuadros
}

const CUADROS = calcularCuadros()

export function Mosaico(): React.JSX.Element {
  return (
    <div className="mosaico" aria-hidden="true">
      {CUADROS.map(({ x, y, lado, color, tipo, retraso, d }) => (
        <span
          key={`${x},${y}`}
          className={`mosaico__cuadro mosaico__cuadro--${tipo}`}
          style={
            {
              left: x - lado / 2,
              top: y - lado / 2,
              width: lado,
              height: lado,
              background: color,
              '--retraso': Math.round(retraso),
              '--d': d.toFixed(3)
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
