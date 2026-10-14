// Solo desarrollo: estado de ejemplo para abrir la app directo en una pantalla.
// TOTEM_PANTALLA=boleto TOTEM_NOMBRE="María José" npm run dev (ver main/index.ts).
import { barajarOpciones } from '@shared/quiz'
import { calcularResultado } from '@shared/result'
import type { Talento } from '@shared/types'
import type { ConfigRenderer } from '@shared/content'
import { ESTADO_INICIAL, type FlowState, type Pantalla } from './flow'

const PANTALLAS: Pantalla[] = ['idle', 'registro', 'quiz', 'calculando', 'boleto', 'admin']
// V V V A I → Reflejo → simulador.
const RESPUESTAS: Talento[] = ['V', 'V', 'V', 'A', 'I']

export function estadoDev(
  pantalla: Pantalla,
  config: ConfigRenderer,
  nombre = 'Zdenko'
): FlowState {
  if (pantalla === 'idle' || pantalla === 'admin') return { ...ESTADO_INICIAL, pantalla }
  const enQuiz = pantalla === 'quiz'
  return {
    pantalla,
    registro: {
      nombre,
      apellido: 'Núñez López',
      email: 'zdenko@ejemplo.com',
      telefono: '5512345678',
      aceptoPrivacidad: true
    },
    respuestas: enQuiz ? [] : RESPUESTAS,
    preguntaActual: 0,
    inicioMs: Date.now(),
    ordenOpciones: barajarOpciones(),
    resultado: pantalla === 'boleto' ? calcularResultado(RESPUESTAS, config.reglas) : null
  }
}

/** Estado inicial según ?pantalla=…&nombre=… en la URL (solo la pone main en desarrollo). */
export function estadoInicialDev(config: ConfigRenderer): FlowState {
  const params = new URLSearchParams(location.search)
  const pantalla = params.get('pantalla') as Pantalla | null
  if (!pantalla || !PANTALLAS.includes(pantalla)) return ESTADO_INICIAL
  return estadoDev(pantalla, config, params.get('nombre') ?? undefined)
}
