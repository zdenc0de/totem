// Esquema y valores por defecto de resources/content.json (CLAUDE.md §12).
// El renderer solo importa tipos de aquí, para que zod no entre a su bundle.
import { z } from 'zod'
import type { Juego } from './types'
import { PRIVACY_VERSION, TEXTO_PRIVACIDAD } from './privacidad'

const juegoId = z.enum(['simulador', 'pera'])
const talento = z.object({ nombre: z.string().min(1), frase: z.string() })
const juego = z.object({
  nombre: z.string().min(1),
  qrUrl: z.string(),
  /** PNG o JPG del QR ya hecho, relativo a la carpeta del content.json. Tiene prioridad sobre qrUrl. */
  qrImage: z.string().min(1).nullable()
})
const segundos = z.number().int().positive()

export const contenidoSchema = z.object({
  talentos: z.object({ A: talento, I: talento, V: talento }),
  juegos: z.object({ simulador: juego, pera: juego }),
  reglas: z.object({
    juegoPorTalento: z.object({ A: juegoId, I: juegoId }),
    versatilPorPregunta: z.array(juegoId).length(5),
    empateVersatil: juegoId
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
  qr: Record<Juego, string | null>
}

export const CONTENIDO_POR_DEFECTO: Contenido = {
  talentos: {
    A: {
      nombre: 'Talento Acelerador',
      frase: 'Decides rápido y conviertes las ideas en acción.'
    },
    I: {
      nombre: 'Talento de Impacto',
      frase: 'Tu constancia mueve los proyectos que otros sueltan.'
    },
    V: {
      nombre: 'Talento Versátil',
      frase: 'Lees el momento y respondes antes que nadie.'
    }
  },
  juegos: {
    simulador: { nombre: 'Simulador de carreras', qrUrl: 'PENDIENTE', qrImage: null },
    pera: { nombre: 'Pera de box', qrUrl: 'PENDIENTE', qrImage: null }
  },
  reglas: {
    juegoPorTalento: { A: 'simulador', I: 'pera' },
    versatilPorPregunta: ['simulador', 'pera', 'simulador', 'pera', 'pera'],
    empateVersatil: 'pera'
  },
  tiempos: { inactividadSeg: 45, avisoInactividadSeg: 15, boletoSeg: 60 },
  showGameOnTicket: false,
  privacidad: { version: PRIVACY_VERSION, texto: TEXTO_PRIVACIDAD },
  adminPinDefault: '1234'
}
