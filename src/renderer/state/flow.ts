// Máquina de estados del flujo (CLAUDE.md §4). Reducer puro.
import type { Talento } from '@shared/types'
import type { Resultado } from '@shared/result'
import { PREGUNTAS } from '@shared/quiz'

export type Pantalla = 'idle' | 'registro' | 'quiz' | 'calculando' | 'boleto' | 'admin'

export type DatosRegistro = {
  nombre: string
  apellido: string
  email: string
  telefono: string
  aceptoPrivacidad: boolean
}

export type FlowState = {
  pantalla: Pantalla
  registro: DatosRegistro | null
  respuestas: Talento[]
  preguntaActual: number
  /** Momento (ms) en que se entró a REGISTRO, para calcular duracionSeg. */
  inicioMs: number | null
  /** Orden de las opciones de cada pregunta, barajado una vez por participante. */
  ordenOpciones: Talento[][]
  resultado: Resultado | null
}

export type FlowAction =
  | { type: 'INICIAR'; ahoraMs: number; ordenOpciones: Talento[][] }
  | { type: 'ENVIAR_REGISTRO'; datos: DatosRegistro }
  | { type: 'RESPONDER'; talento: Talento }
  | { type: 'ATRAS' }
  | { type: 'CALCULO_TERMINADO'; resultado: Resultado }
  | { type: 'REINICIAR' }
  | { type: 'ABRIR_ADMIN' }
  | { type: 'CERRAR_ADMIN' }
  | { type: 'DEV_IR'; estado: FlowState }

export const ESTADO_INICIAL: FlowState = {
  pantalla: 'idle',
  registro: null,
  respuestas: [],
  preguntaActual: 0,
  inicioMs: null,
  ordenOpciones: [],
  resultado: null
}

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'INICIAR':
      if (state.pantalla !== 'idle') return state
      return {
        ...ESTADO_INICIAL,
        pantalla: 'registro',
        inicioMs: action.ahoraMs,
        ordenOpciones: action.ordenOpciones
      }

    case 'ENVIAR_REGISTRO':
      if (state.pantalla !== 'registro') return state
      return {
        ...state,
        pantalla: 'quiz',
        registro: action.datos,
        respuestas: [],
        preguntaActual: 0
      }

    case 'RESPONDER': {
      if (state.pantalla !== 'quiz') return state
      const respuestas = [...state.respuestas.slice(0, state.preguntaActual), action.talento]
      if (respuestas.length === PREGUNTAS.length) {
        return { ...state, respuestas, pantalla: 'calculando' }
      }
      return { ...state, respuestas, preguntaActual: state.preguntaActual + 1 }
    }

    case 'ATRAS':
      if (state.pantalla !== 'quiz') return state
      if (state.preguntaActual === 0) return { ...state, pantalla: 'registro' }
      return { ...state, preguntaActual: state.preguntaActual - 1 }

    case 'CALCULO_TERMINADO':
      if (state.pantalla !== 'calculando') return state
      return { ...state, pantalla: 'boleto', resultado: action.resultado }

    // Volver a IDLE siempre borra todo: no puede quedar nada del participante anterior.
    case 'REINICIAR':
      return ESTADO_INICIAL

    case 'ABRIR_ADMIN':
      if (state.pantalla !== 'idle') return state
      return { ...ESTADO_INICIAL, pantalla: 'admin' }

    case 'CERRAR_ADMIN':
      return ESTADO_INICIAL

    case 'DEV_IR':
      return action.estado
  }
}
