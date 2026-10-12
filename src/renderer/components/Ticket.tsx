import { useRef } from 'react'
import { motion } from 'framer-motion'
import logoConaip from '../../../assets/logos/conaip.svg'
import logoEliot from '../../../assets/logos/elliot_svg.svg'
import { useAjustarTexto } from './useAjustarTexto'

// Boleto del resultado (CLAUDE.md §7), en px del artboard. La forma (muescas, pestaña de la
// franja blanca, franjas rojas y borde dorado) es un SVG; el contenido va encima en HTML.
export const TICKET_ANCHO = 936
export const TICKET_ALTO = 1640

const FRANJA_ALTO = 196
const MUESCA_Y = 1060
const MUESCA_R = 38
const ESQUINA_R = 44
const BORDE = 10

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
  useAjustarTexto(refNombre, nombre, 104, 36)
  useAjustarTexto(refTalento, talento, 112, 56)

  return (
    <div className="ticket" style={{ width: TICKET_ANCHO, height: TICKET_ALTO }}>
      <FondoTicket />

      <div className="ticket__franja" style={{ height: FRANJA_ALTO }}>
        <img className="ticket__logo-conaip" src={logoConaip} alt="CONAIP" />
        <span className="ticket__logos-division" />
        <img className="ticket__logo-eliot" src={logoEliot} alt="Eliot Awards" />
      </div>

      <div className="ticket__cuerpo">
        <div className="ticket__encabezado">
          <p ref={refNombre} className="ticket__nombre">
            {nombre},
          </p>
          <p className="ticket__etiqueta">Tu tipo de talento es</p>
          <span className="ticket__acento" aria-hidden="true" />
        </div>

        <h2 ref={refTalento} className="ticket__talento">
          {talento}
        </h2>
        <p className="ticket__frase">{frase}</p>

        <motion.div
          className="ticket__qr"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.35, ease: 'easeOut' }}
        >
          {qr ? (
            <img src={qr} alt="Código QR de tu juego" />
          ) : (
            <span className="ticket__qr-pendiente">QR pendiente</span>
          )}
        </motion.div>

        {juego && <p className="ticket__juego">{juego}</p>}

        <div className="ticket__escanea">
          <span className="ticket__escanea-barra" aria-hidden="true" />
          <span className="ticket__escanea-titulo">Escanea</span>
          <span className="ticket__escanea-division" aria-hidden="true" />
          <span className="ticket__escanea-texto">
            para descubrir
            <br />
            tu juego
          </span>
        </div>
      </div>
    </div>
  )
}

/** Contorno del boleto: esquinas redondeadas y una muesca semicircular a cada lado. */
function contorno(): string {
  const s = BORDE / 2
  const [x0, y0, x1, y1] = [s, s, TICKET_ANCHO - s, TICKET_ALTO - s]
  const r = ESQUINA_R
  const n = MUESCA_R
  return [
    `M ${x0 + r} ${y0} H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
    `V ${MUESCA_Y - n} A ${n} ${n} 0 0 0 ${x1} ${MUESCA_Y + n}`,
    `V ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    `V ${MUESCA_Y + n} A ${n} ${n} 0 0 0 ${x0} ${MUESCA_Y - n}`,
    `V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`
  ].join(' ')
}

/** Franja diagonal (paralelogramo) que sube hacia la derecha. */
function franja(x: number, y: number, largo: number, grueso: number): string {
  const dx = largo * Math.cos(Math.PI / 5)
  const dy = largo * Math.sin(Math.PI / 5)
  return `${x},${y} ${x + dx},${y - dy} ${x + dx},${y - dy + grueso} ${x},${y + grueso}`
}

function FondoTicket(): React.JSX.Element {
  const W = TICKET_ANCHO
  const H = TICKET_ALTO
  const c = W / 2
  const forma = contorno()
  return (
    <svg className="ticket__fondo" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <clipPath id="ticket-forma">
          <path d={forma} />
        </clipPath>
        <linearGradient id="ticket-azul" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#0c53a2" />
          <stop offset="0.55" stopColor="#0a4589" />
          <stop offset="1" stopColor="#062d5e" />
        </linearGradient>
        <radialGradient id="ticket-brillo" cx="0.5" cy="0.36" r="0.55">
          <stop offset="0" stopColor="#3f86d6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3f86d6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath="url(#ticket-forma)">
        <rect width={W} height={H} fill="url(#ticket-azul)" />
        <rect width={W} height={H} fill="url(#ticket-brillo)" />
        {/* Bandas claras y franjas rojas en diagonal, como el boleto del cliente. */}
        <polygon points={franja(-120, 1240, 900, 140)} fill="#ffffff" opacity="0.05" />
        <polygon points={franja(260, 1700, 900, 90)} fill="#ffffff" opacity="0.04" />
        <polygon points={franja(-40, 600, 230, 30)} style={{ fill: 'var(--rojo)' }} />
        <polygon points={franja(-40, 660, 140, 12)} style={{ fill: 'var(--rojo)', opacity: 0.7 }} />
        <polygon points={franja(W - 190, 900, 320, 26)} style={{ fill: 'var(--rojo)' }} />
        <polygon points={franja(W - 300, H + 40, 420, 40)} style={{ fill: 'var(--rojo)' }} />
        <polygon
          points={franja(W - 230, H + 40, 300, 14)}
          style={{ fill: 'var(--rojo)', opacity: 0.7 }}
        />
        {/* Franja blanca de logos con su pestaña al centro. */}
        <path
          d={`M 0 0 H ${W} V ${FRANJA_ALTO} H ${c + 110} A 110 40 0 0 1 ${c - 110} ${FRANJA_ALTO} H 0 Z`}
          fill="#ffffff"
        />
      </g>
      <path d={forma} fill="none" strokeWidth={BORDE} style={{ stroke: 'var(--dorado)' }} />
    </svg>
  )
}
