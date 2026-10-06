// Diseños y lógica pura del teclado en pantalla (CLAUDE.md §10).

export type DisenoTeclado = 'alfabetico' | 'correo' | 'numerico'

/** `ancho` es proporcional: 1 = una tecla de letra. */
export type Tecla =
  | { tipo: 'texto'; valor: string; ancho?: number }
  | { tipo: 'mayus' | 'borrar' | 'espacio' | 'accion'; ancho?: number }

const letras = (fila: string): Tecla[] => [...fila].map((valor) => ({ tipo: 'texto', valor }))
const anchas = (valores: string[], ancho: number): Tecla[] =>
  valores.map((valor) => ({ tipo: 'texto', valor, ancho }))

export const DISENOS: Record<DisenoTeclado, Tecla[][]> = {
  alfabetico: [
    letras('qwertyuiop'),
    letras('asdfghjklñ'),
    [{ tipo: 'mayus', ancho: 1.5 }, ...letras('zxcvbnm'), { tipo: 'borrar', ancho: 1.5 }],
    letras("áéíóúü'-"),
    [
      { tipo: 'espacio', ancho: 7 },
      { tipo: 'accion', ancho: 3 }
    ]
  ],
  correo: [
    letras('1234567890'),
    letras('qwertyuiop'),
    letras('asdfghjkl_'),
    [...letras('zxcvbnm-'), { tipo: 'borrar', ancho: 2 }],
    anchas(['@gmail.com', '@hotmail.com', '@outlook.com', '.com'], 2.5),
    [...anchas(['@', '.'], 2.5), { tipo: 'accion', ancho: 5 }]
  ],
  numerico: [
    letras('123'),
    letras('456'),
    letras('789'),
    [{ tipo: 'borrar' }, ...letras('0'), { tipo: 'accion' }]
  ]
}

/**
 * Agrega lo tecleado al final. Un atajo de dominio sustituye lo que haya después de la @:
 * "ana@gm" + "@gmail.com" → "ana@gmail.com".
 */
export function escribir(valor: string, texto: string): string {
  if (texto.length > 1 && texto.startsWith('@')) return valor.split('@')[0] + texto
  return valor + texto
}

export function borrar(valor: string): string {
  return valor.slice(0, -1)
}

/** Mayúscula automática al empezar cada palabra de nombre y apellido ("Ana-Sofía López"). */
export function mayusculaAutomatica(valor: string): boolean {
  return valor === '' || /[ -]$/.test(valor)
}
