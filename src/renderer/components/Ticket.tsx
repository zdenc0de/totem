import { useRef } from 'react'
import { motion } from 'framer-motion'
import logoConaip from '../../../assets/logos/conaip.svg'
import logoEliot from '../../../assets/logos/elliot_svg.svg'
import { useAjustarTexto } from './useAjustarTexto'
import { Pixeles, type Cuadro } from './Pixeles'
import { aleatorio } from './aleatorio'

// Boleto del resultado (CLAUDE.md §7), según los bocetos del cliente (assets/boletos_boceto/).
// Todo va en px del artboard. La forma (pestaña arriba, muescas a los lados, papel y borde) es un
// SVG; encima van los píxeles de las esquinas y el contenido en HTML.
// Solo usa colores de las dos marcas (tokens.css): rojo y azul de CONAIP; Yellow X, sus tintes,
// negro, sus grises y blanco de Eliot. Todos planos: sin degradados, sombras ni transparencias.
export const TICKET_ANCHO = 936
export const TICKET_ALTO = 1640

const BORDE = 12
const ESQUINA_R = 48
const MUESCA_R = 40
const MUESCA_Y = 700
const PESTANA = { ancho: 232, fondo: 88, profundo: 46 } // muesca de arriba, al centro

// Posición y tamaño de cada bloque. Los píxeles los esquivan (ver ZONAS_LIBRES y TARJETAS).
const LOGOS = { y: 64, alto: 148 }
const ENCABEZADO = { y: 228, alto: 460, ancho: 660 }
const QR = { y: 712, ancho: 604, alto: 660 }
const DESCUBRE = { y: 1392, alto: 52, ancho: 720 }
const RED = { y: 1476, alto: 88, ancho: 560 }

type Props = {
  nombre: string
  talento: string
  frase: string
  /** Data URL del QR del juego; `null` mientras no haya URL ni imagen en config. */
  qr: string | null
  /** Solo si `showGameOnTicket` está activo en config. */
  juego?: string
}

export function Ticket({ nombre, talento, frase, qr, juego }: Props): React.JSX.Element {
  const refNombre = useRef<HTMLParagraphElement>(null)
  const refTalento = useRef<HTMLHeadingElement>(null)
  useAjustarTexto(refNombre, nombre, 80, 30)
  useAjustarTexto(refTalento, talento, 136, 64)

  return (
    <div className="ticket" style={{ width: TICKET_ANCHO, height: TICKET_ALTO }}>
      <FondoTicket />
      <Pixeles cuadros={CUADROS} />

      <div className="ticket__logos" style={{ top: LOGOS.y, height: LOGOS.alto }}>
        <img className="ticket__logo-conaip" src={logoConaip} alt="CONAIP" />
        <span className="ticket__logos-division" aria-hidden="true" />
        <span className="ticket__logos-por" aria-hidden="true">
          ×
        </span>
        <img className="ticket__logo-eliot" src={logoEliot} alt="Eliot Awards" />
      </div>

      <div
        className="ticket__encabezado"
        style={{ top: ENCABEZADO.y, height: ENCABEZADO.alto, width: ENCABEZADO.ancho }}
      >
        <p ref={refNombre} className="ticket__nombre">
          {nombre},
        </p>
        <p className="ticket__etiqueta">tu tipo de talento es:</p>
        <h2 ref={refTalento} className="ticket__talento" data-texto={talento}>
          {talento}
        </h2>
        <p className="ticket__frase">{frase}</p>
      </div>

      <motion.div
        className="ticket__qr"
        style={{ top: QR.y, width: QR.ancho, height: QR.alto }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.35, ease: 'easeOut' }}
      >
        <p className="ticket__qr-titulo">Escanea aquí</p>
        <div className="ticket__qr-tarjeta">
          {qr ? (
            <img src={qr} alt="Código QR de tu juego" />
          ) : (
            <span className="ticket__qr-pendiente">QR pendiente</span>
          )}
        </div>
      </motion.div>

      <p className="ticket__descubre" style={{ top: DESCUBRE.y, height: DESCUBRE.alto }}>
        {juego ? `Tu juego: ${juego}` : 'para descubrir tu juego'}
      </p>

      <div className="ticket__red" style={{ top: RED.y, height: RED.alto, width: RED.ancho }}>
        <span className="ticket__red-contenido">
          <IconoInstagram />
          @CONAIP_MX
        </span>
      </div>
    </div>
  )
}

function IconoInstagram(): React.JSX.Element {
  return (
    <svg className="ticket__red-icono" viewBox="0 0 48 48" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />
      <circle cx="24" cy="24" r="9" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="35" cy="13" r="2.8" fill="currentColor" />
    </svg>
  )
}

/** Contorno del boleto: esquinas redondeadas, pestaña arriba y una muesca a cada lado. */
function contorno(): string {
  const s = BORDE / 2
  const [x0, y0, x1, y1] = [s, s, TICKET_ANCHO - s, TICKET_ALTO - s]
  const c = TICKET_ANCHO / 2
  const r = ESQUINA_R
  const n = MUESCA_R
  const a = PESTANA.ancho / 2
  const f = PESTANA.fondo / 2
  const p = y0 + PESTANA.profundo
  return [
    `M ${x0 + r} ${y0} H ${c - a}`,
    `C ${c - a + 34} ${y0} ${c - f - 26} ${p} ${c - f} ${p} H ${c + f}`,
    `C ${c + f + 26} ${p} ${c + a - 34} ${y0} ${c + a} ${y0}`,
    `H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
    `V ${MUESCA_Y - n} A ${n} ${n} 0 0 0 ${x1} ${MUESCA_Y + n}`,
    `V ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    `V ${MUESCA_Y + n} A ${n} ${n} 0 0 0 ${x0} ${MUESCA_Y - n}`,
    `V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`
  ].join(' ')
}

/** Banda diagonal (paralelogramo) que sube hacia la derecha: los reflejos del papel (Black 10%). */
function banda(x: number, y: number, largo: number, grueso: number): string {
  const dx = largo * Math.cos(Math.PI / 4.4)
  const dy = largo * Math.sin(Math.PI / 4.4)
  return `${x},${y} ${x + dx},${y - dy} ${x + dx},${y - dy + grueso} ${x},${y + grueso}`
}

function FondoTicket(): React.JSX.Element {
  const W = TICKET_ANCHO
  const H = TICKET_ALTO
  const forma = contorno()
  return (
    <svg className="ticket__fondo" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <clipPath id="ticket-forma">
          <path d={forma} />
        </clipPath>
      </defs>
      <path d={forma} style={{ fill: 'var(--blanco)' }} />
      <g clipPath="url(#ticket-forma)" style={{ fill: 'var(--negro-10)' }}>
        <polygon points={banda(-160, 1180, 1500, 140)} />
        <polygon points={banda(-160, 1420, 1500, 44)} />
        <polygon points={banda(-160, 700, 1300, 80)} />
      </g>
      <path d={forma} fill="none" strokeWidth={BORDE} style={{ stroke: 'var(--amarillo-x)' }} />
    </svg>
  )
}

// Píxeles de las esquinas: la trama de medios tonos del boceto, en el lenguaje de mosaico de
// IDLE. Cada lado lleva el color de la marca cuyo logo tiene arriba: azul CONAIP a la izquierda
// y amarillo Eliot a la derecha. Se arman de la esquina hacia el centro y después laten.

const PASO = 24 // separación de la retícula
const ALCANCE_PIXELES = 1.4 // hasta dónde llegan los píxeles sueltos (1 = orilla de la trama)
const DESVANECIDO = 44 // px antes del texto en los que la trama se encoge hasta desaparecer

type Marca = 'conaip' | 'eliot'
// Origen de cada trama y sus radios (elipse), en px del boleto.
const ESQUINAS: { x: number; y: number; rx: number; ry: number; marca: Marca }[] = [
  { x: 0, y: 0, rx: 220, ry: 600, marca: 'conaip' },
  { x: 0, y: TICKET_ALTO, rx: 400, ry: 470, marca: 'conaip' },
  { x: TICKET_ANCHO, y: 360, rx: 200, ry: 400, marca: 'eliot' },
  { x: TICKET_ANCHO, y: TICKET_ALTO, rx: 480, ry: 560, marca: 'eliot' }
]

const COLORES: Record<Marca, { trama: string; sueltos: string[] }> = {
  conaip: {
    trama: 'var(--azul)',
    sueltos: ['var(--azul)', 'var(--azul)', 'var(--azul)', 'var(--rojo)']
  },
  eliot: {
    trama: 'var(--amarillo-x)',
    sueltos: [
      'var(--amarillo-x)',
      'var(--amarillo-x)',
      'var(--amarillo-2)',
      'var(--negro)',
      'var(--negro-80)'
    ]
  }
}

type Rect = { x0: number; y0: number; x1: number; y1: number }
const centrado = (y: number, alto: number, ancho: number): Rect => ({
  x0: (TICKET_ANCHO - ancho) / 2,
  y0: y,
  x1: (TICKET_ANCHO + ancho) / 2,
  y1: y + alto
})
// Los textos y los logos van sobre papel limpio (y la pestaña de arriba no lleva píxeles).
const ZONAS_LIBRES: Rect[] = [
  centrado(0, PESTANA.profundo + BORDE + 16, PESTANA.ancho + 24),
  centrado(LOGOS.y, LOGOS.alto, 736),
  centrado(ENCABEZADO.y, ENCABEZADO.alto, ENCABEZADO.ancho),
  centrado(DESCUBRE.y, DESCUBRE.alto, DESCUBRE.ancho)
]
// El marco del QR y la banda de redes son opacos: la trama pasa por debajo, como en el boceto.
// 24°: la inclinación de .ticket__red.
const TARJETAS: Rect[] = [
  centrado(QR.y, QR.alto, QR.ancho),
  centrado(RED.y, RED.alto, RED.ancho + 2 * RED.alto * Math.tan((24 * Math.PI) / 180))
]

/** Si el cuadro de centro (x, y) y lado `l` queda dentro del boleto, sin tocar el borde. */
function dentroDelBoleto(x: number, y: number, l: number): boolean {
  const margen = BORDE + 6
  const media = l / 2
  if (x - media < margen || x + media > TICKET_ANCHO - margen) return false
  if (y - media < margen || y + media > TICKET_ALTO - margen) return false
  // Esquinas redondeadas: la punta del cuadro no debe salir del arco.
  const r = ESQUINA_R
  const cx = Math.min(Math.max(x, r), TICKET_ANCHO - r)
  const cy = Math.min(Math.max(y, r), TICKET_ALTO - r)
  if (Math.hypot(x - cx, y - cy) > r - margen - l * 0.71) return false
  // Muescas de los lados.
  for (const mx of [0, TICKET_ANCHO]) {
    if (Math.hypot(x - mx, y - MUESCA_Y) < MUESCA_R + margen + l * 0.71) return false
  }
  return true
}

/** Si el cuadro queda tapado por completo por una tarjeta (no vale la pena dibujarlo). */
function tapado(x: number, y: number, l: number): boolean {
  const media = l / 2
  return TARJETAS.some(
    (t) => x - media >= t.x0 && x + media <= t.x1 && y - media >= t.y0 && y + media <= t.y1
  )
}

/** Distancia del punto (x, y) al texto más cercano (0 si está encima). */
function distanciaAlContenido(x: number, y: number): number {
  let min = Infinity
  for (const z of ZONAS_LIBRES) {
    const dx = Math.max(z.x0 - x, x - z.x1, 0)
    const dy = Math.max(z.y0 - y, y - z.y1, 0)
    min = Math.min(min, Math.hypot(dx, dy))
  }
  return min
}

function calcularCuadros(): Cuadro[] {
  const azar = aleatorio(7)
  const cuadros: Cuadro[] = []
  const columnas = Math.floor(TICKET_ANCHO / PASO)
  const filas = Math.floor(TICKET_ALTO / PASO)
  const x0 = (TICKET_ANCHO - columnas * PASO) / 2 + PASO / 2
  const y0 = (TICKET_ALTO - filas * PASO) / 2 + PASO / 2

  for (let fila = 0; fila < filas; fila++) {
    for (let col = 0; col < columnas; col++) {
      const x = x0 + col * PASO
      const y = y0 + fila * PASO

      // La trama más cercana manda en esta celda.
      let d = Infinity
      let marca: Marca = 'conaip'
      for (const e of ESQUINAS) {
        const de = Math.hypot((x - e.x) / e.rx, (y - e.y) / e.ry)
        if (de < d) [d, marca] = [de, e.marca]
      }
      if (d > ALCANCE_PIXELES) continue
      // Cerca del texto la trama se encoge y no hay píxeles sueltos.
      const libre = (distanciaAlContenido(x, y) - PASO / 2 - 6) / DESVANECIDO
      if (libre <= 0) continue
      const { trama, sueltos } = COLORES[marca]
      const retraso = 420 + d * 650

      let cuadro: Cuadro | null = null
      const suelto = (): Cuadro => ({
        x,
        y,
        lado: PASO,
        color: sueltos[Math.floor(azar() * sueltos.length)],
        tipo: azar() < 0.3 ? 'brillo' : 'pixel',
        retraso,
        d
      })
      if (d <= 1) {
        // Hacia la orilla, algunos cuadros de la trama ya son píxeles sueltos.
        const seSuelta = d > 0.6 && azar() < ((d - 0.6) / 0.4) * 0.5
        if (seSuelta) {
          if (libre >= 1) cuadro = suelto()
        } else {
          // Medios tonos: cuadros grandes en la esquina que se encogen hacia el centro.
          const lado = PASO * 0.9 * (1 - d ** 1.8) * Math.min(1, libre)
          if (lado >= 9) cuadro = { x, y, lado, color: trama, tipo: 'trama', retraso, d }
        }
      } else {
        const caida = 1 - (d - 1) / (ALCANCE_PIXELES - 1)
        if (azar() < 0.45 * caida ** 1.4 && libre >= 1) cuadro = suelto()
      }
      if (cuadro && dentroDelBoleto(x, y, cuadro.lado) && !tapado(x, y, cuadro.lado)) {
        cuadros.push(cuadro)
      }
    }
  }
  return cuadros
}

const CUADROS = calcularCuadros()
