// Esquema y valores por defecto de resources/content.json (CLAUDE.md §12).
// El renderer solo importa tipos de aquí, para que zod no entre a su bundle.
import { z } from 'zod'
import type { Talento } from './types'
import { PRIVACY_VERSION, TEXTO_PRIVACIDAD } from './privacidad'

const juegoId = z.enum(['simulador', 'pera'])
// Un QR por talento: lleva a la página con la imagen de ese talento y su juego.
const talento = z.object({
  nombre: z.string().min(1),
  frase: z.string(),
  qrUrl: z.string(),
  /** PNG o JPG del QR ya hecho, relativo a la carpeta del content.json. Tiene prioridad sobre qrUrl. */
  qrImage: z.string().min(1).nullable()
})
const juego = z.object({ nombre: z.string().min(1) })
const segundos = z.number().int().positive()

export const contenidoSchema = z.object({
  talentos: z.object({ A: talento, I: talento, V: talento }),
  juegos: z.object({ simulador: juego, pera: juego }),
  reglas: z.object({
    juegoPorTalento: z.object({ A: juegoId, I: juegoId, V: juegoId })
  }),
  tiempos: z.object({
    inactividadSeg: segundos,
    avisoInactividadSeg: segundos,
    boletoSeg: segundos
  }),
  showGameOnTicket: z.boolean(),
  privacidad: z.object({ version: z.string().min(1), texto: z.string().min(1) }),
  adminPinDefault: z.string().regex(/^\d{4,8}$/)
})

export type Contenido = z.infer<typeof contenidoSchema>

/** Lo que recibe el renderer: el contenido sin el PIN y con los QR ya generados (data URL o null). */
export type ConfigRenderer = Omit<Contenido, 'adminPinDefault'> & {
  qr: Record<Talento, string | null>
}

export const CONTENIDO_POR_DEFECTO: Contenido = {
  talentos: {
    A: {
      nombre: 'Acelerador',
      frase: 'Decides rápido y conviertes las ideas en acción',
      qrUrl: 'PENDIENTE',
      qrImage: null
    },
    I: {
      nombre: 'Impulsor',
      frase: 'Tu constancia mueve los proyectos que otros sueltan',
      qrUrl: 'PENDIENTE',
      qrImage: null
    },
    V: {
      nombre: 'Reflejo',
      frase: 'Lees el momento y respondes antes que nadie',
      qrUrl: 'PENDIENTE',
      qrImage: null
    }
  },
  juegos: {
    simulador: { nombre: 'Simulador de carreras' },
    pera: { nombre: 'Pera de box' }
  },
  reglas: {
    juegoPorTalento: { A: 'simulador', I: 'pera', V: 'simulador' }
  },
  tiempos: { inactividadSeg: 45, avisoInactividadSeg: 15, boletoSeg: 60 },
  showGameOnTicket: false,
  privacidad: { version: PRIVACY_VERSION, texto: TEXTO_PRIVACIDAD },
  adminPinDefault: '1234'
}
