// Validaciones del registro (CLAUDE.md §10). Funciones puras: el renderer las usa al
// capturar y el proceso principal debe repetirlas al guardar.
import type { Registro } from './types'

export const NOMBRE_MIN_LETRAS = 2
export const NOMBRE_MAX = 60
export const EMAIL_MAX = 80
export const TELEFONO_DIGITOS = 10

export type CamposRegistro = Pick<Registro, 'nombre' | 'apellido' | 'email' | 'telefono'> & {
  aceptoPrivacidad: boolean
}

/** Mensaje amable por campo; `null` si el campo es válido. */
export type ErroresRegistro = Record<keyof CamposRegistro, string | null>

// Letras (con acentos y ñ), espacios, apóstrofe (recto o tipográfico) y guion.
const NOMBRE_PERMITIDO = /^[\p{L}\p{M}' ’-]+$/u
const NOMBRE_NO_PERMITIDO = /[^\p{L}\p{M}' ’-]/gu
const LETRA = /\p{L}/gu
// Usuario y dominio sin puntos al inicio, al final ni seguidos; dominio de 2+ letras.
const EMAIL = /^[a-z0-9_%+-]+(\.[a-z0-9_%+-]+)*@([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/

// Nombre(s) y apellido siguen las mismas reglas.

/** Limpia lo que se va escribiendo: sin caracteres inválidos, espacios al inicio ni dobles. */
export function limpiarNombre(valor: string): string {
  return valor
    .replace(NOMBRE_NO_PERMITIDO, '')
    .replace(/^ +/, '')
    .replace(/ {2,}/g, ' ')
    .slice(0, NOMBRE_MAX)
}

export function normalizarNombre(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ')
}

function validarTextoPersonal(valor: string, que: 'nombre' | 'apellido'): string | null {
  const texto = normalizarNombre(valor)
  if (!texto) return `Escribe tu ${que}.`
  if (!NOMBRE_PERMITIDO.test(texto)) return "Usa solo letras, espacios, apóstrofe (') o guion (-)."
  if ((texto.match(LETRA) ?? []).length < NOMBRE_MIN_LETRAS) {
    return `Tu ${que} debe tener al menos ${NOMBRE_MIN_LETRAS} letras.`
  }
  if (texto.length > NOMBRE_MAX) return `Tu ${que} puede tener hasta ${NOMBRE_MAX} caracteres.`
  return null
}

export const validarNombre = (valor: string): string | null => validarTextoPersonal(valor, 'nombre')
export const validarApellido = (valor: string): string | null =>
  validarTextoPersonal(valor, 'apellido')

/** Limpia lo que se va escribiendo: sin espacios y en minúsculas. */
export function limpiarEmail(valor: string): string {
  return valor.replace(/\s/g, '').toLowerCase().slice(0, EMAIL_MAX)
}

export function normalizarEmail(valor: string): string {
  return valor.trim().toLowerCase()
}

export function validarEmail(valor: string): string | null {
  const email = normalizarEmail(valor)
  if (!email) return 'Escribe tu correo electrónico.'
  if (email.length > EMAIL_MAX) return `Tu correo puede tener hasta ${EMAIL_MAX} caracteres.`
  if (!EMAIL.test(email)) return 'Revisa tu correo; debe verse como nombre@correo.com.'
  return null
}

/** Limpia lo que se va escribiendo: solo dígitos, máximo 10. */
export function limpiarTelefono(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, TELEFONO_DIGITOS)
}

export function validarTelefono(valor: string): string | null {
  if (!valor) return 'Escribe tu teléfono.'
  if (!/^\d+$/.test(valor)) return 'Usa solo números en tu teléfono.'
  if (valor.length < TELEFONO_DIGITOS) {
    const faltan = TELEFONO_DIGITOS - valor.length
    const aviso = faltan === 1 ? 'te falta 1' : `te faltan ${faltan}`
    return `Tu teléfono debe tener ${TELEFONO_DIGITOS} dígitos (${aviso}).`
  }
  if (valor.length > TELEFONO_DIGITOS) return `Tu teléfono debe tener ${TELEFONO_DIGITOS} dígitos.`
  return null
}

export function validarRegistro(campos: CamposRegistro): ErroresRegistro {
  return {
    nombre: validarNombre(campos.nombre),
    apellido: validarApellido(campos.apellido),
    email: validarEmail(campos.email),
    telefono: validarTelefono(campos.telefono),
    aceptoPrivacidad: campos.aceptoPrivacidad
      ? null
      : 'Acepta el aviso de privacidad para continuar.'
  }
}

export function esRegistroValido(errores: ErroresRegistro): boolean {
  return Object.values(errores).every((error) => error === null)
}

/** Datos listos para guardar: nombre y apellido sin espacios sobrantes, correo en minúsculas. */
export function normalizarRegistro(campos: CamposRegistro): CamposRegistro {
  return {
    ...campos,
    nombre: normalizarNombre(campos.nombre),
    apellido: normalizarNombre(campos.apellido),
    email: normalizarEmail(campos.email)
  }
}
