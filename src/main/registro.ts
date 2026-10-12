// Arma el Registro que se guarda (CLAUDE.md §9). Main no confía en el renderer: vuelve a
// validar y normalizar los datos y recalcula el resultado.
import type { Registro, TotemId } from '@shared/types'
import { esRegistroValido, normalizarRegistro, validarRegistro } from '@shared/validation'
import { calcularResultado, esRespuestas, type Reglas, type Resultado } from '@shared/result'
import { isoLocal } from '@shared/fecha'

export type Contexto = {
  id: string
  totemId: TotemId
  privacyVersion: string
  reglas: Reglas
  ahora: Date
}

export type Armado = { registro: Registro; resultado: Resultado } | { error: string }

export function armarRegistro(datos: unknown, ctx: Contexto): Armado {
  if (typeof datos !== 'object' || datos === null) return { error: 'sin datos' }
  const { campos, respuestas, duracionSeg } = datos as Record<string, unknown>

  if (!esCampos(campos)) return { error: 'campos incompletos' }
  const limpios = normalizarRegistro(campos)
  if (!esRegistroValido(validarRegistro(limpios))) return { error: 'campos inválidos' }
  if (!esRespuestas(respuestas)) return { error: 'respuestas inválidas' }

  const resultado = calcularResultado(respuestas, ctx.reglas)
  const registro: Registro = {
    id: ctx.id,
    totemId: ctx.totemId,
    createdAt: isoLocal(ctx.ahora),
    nombre: limpios.nombre,
    apellido: limpios.apellido,
    email: limpios.email,
    telefono: limpios.telefono,
    aceptoPrivacidad: true,
    privacyVersion: ctx.privacyVersion,
    respuestas: [...respuestas],
    conteo: resultado.conteo,
    talento: resultado.talento,
    juego: resultado.juego,
    desempate: resultado.desempate,
    duracionSeg:
      typeof duracionSeg === 'number' && Number.isFinite(duracionSeg)
        ? Math.max(0, Math.round(duracionSeg))
        : 0
  }
  return { registro, resultado }
}

function esCampos(c: unknown): c is Parameters<typeof normalizarRegistro>[0] {
  if (typeof c !== 'object' || c === null) return false
  const { nombre, apellido, email, telefono, aceptoPrivacidad } = c as Record<string, unknown>
  return (
    [nombre, apellido, email, telefono].every((v) => typeof v === 'string') &&
    aceptoPrivacidad === true
  )
}
