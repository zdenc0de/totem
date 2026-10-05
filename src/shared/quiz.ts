import type { Talento } from './types'

export type Pregunta = {
  texto: string
  opciones: Record<Talento, string>
}

// CLAUDE.md §5. Índice 0 = pregunta 1.
export const PREGUNTAS: Pregunta[] = [
  {
    texto: '¿Dónde crees que se aprende más?',
    opciones: {
      A: 'En los retos.',
      I: 'En la experiencia de todos los días.',
      V: 'Probando situaciones diferentes.'
    }
  },
  {
    texto: '¿Cómo prefieres demostrar tu talento?',
    opciones: {
      A: 'Con precisión y estrategia.',
      I: 'Con fuerza y determinación.',
      V: 'Resolviendo sobre la marcha.'
    }
  },
  {
    texto: '¿Qué vale más de tu trayectoria laboral?',
    opciones: {
      A: 'Lo que me ayudó a crecer.',
      I: 'Lo que conseguí con esfuerzo.',
      V: 'Todo lo que aprendí en el camino.'
    }
  },
  {
    texto: '¿Cuál describe mejor tu situación actual?',
    opciones: {
      A: 'Quiero llevar mi carrera más lejos.',
      I: 'Quiero que reconozcan lo que sé.',
      V: 'Quiero aprovechar mejor mi experiencia.'
    }
  },
  {
    texto: '¿Qué te gustaría hacer con todo lo que ya sabes?',
    opciones: {
      A: 'Llegar al siguiente nivel.',
      I: 'Hacer que mi experiencia tenga valor.',
      V: 'Convertirlo en nuevas oportunidades.'
    }
  }
]
