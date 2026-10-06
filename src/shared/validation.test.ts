import { describe, expect, it } from 'vitest'
import {
  esRegistroValido,
  limpiarEmail,
  limpiarNombre,
  limpiarTelefono,
  normalizarRegistro,
  validarApellido,
  validarEmail,
  validarNombre,
  validarRegistro,
  validarTelefono
} from './validation'

describe('nombre', () => {
  it.each(['Zdenko', 'María José Núñez', "D'Angelo", 'Ana-Sofía', 'Lú', 'a'.repeat(60)])(
    'acepta %s',
    (nombre) => expect(validarNombre(nombre)).toBeNull()
  )

  it('ignora espacios sobrantes al validar', () => {
    expect(validarNombre('  Ana   López  ')).toBeNull()
  })

  it.each([
    ['', 'Escribe tu nombre.'],
    ['   ', 'Escribe tu nombre.'],
    ['A', 'Tu nombre debe tener al menos 2 letras.'],
    ["A'", 'Tu nombre debe tener al menos 2 letras.'],
    ['--', 'Tu nombre debe tener al menos 2 letras.'],
    ['Ana2', "Usa solo letras, espacios, apóstrofe (') o guion (-)."],
    ['Ana@', "Usa solo letras, espacios, apóstrofe (') o guion (-)."],
    ['a'.repeat(61), 'Tu nombre puede tener hasta 60 caracteres.']
  ])('rechaza %j', (nombre, error) => expect(validarNombre(nombre)).toBe(error))

  it('limpia lo que se escribe', () => {
    expect(limpiarNombre('  Ana  María3 ')).toBe('Ana María ')
    expect(limpiarNombre('Jo$sé_')).toBe('José')
    expect(limpiarNombre('a'.repeat(70))).toHaveLength(60)
  })
})

describe('apellido', () => {
  it.each(['López', 'García Márquez', "O'Brien", 'Pérez-Reverte', 'Li'])('acepta %s', (apellido) =>
    expect(validarApellido(apellido)).toBeNull()
  )

  it.each([
    ['', 'Escribe tu apellido.'],
    ['L', 'Tu apellido debe tener al menos 2 letras.'],
    ['López1', "Usa solo letras, espacios, apóstrofe (') o guion (-)."],
    ['a'.repeat(61), 'Tu apellido puede tener hasta 60 caracteres.']
  ])('rechaza %j', (apellido, error) => expect(validarApellido(apellido)).toBe(error))
})

describe('correo', () => {
  it.each([
    'ana@gmail.com',
    'ana.lopez+eliot@empresa.com.mx',
    'a_b-c@sub-dominio.org',
    `${'a'.repeat(70)}@gmail.com`
  ])('acepta %s', (email) => expect(validarEmail(email)).toBeNull())

  it('acepta mayúsculas y espacios alrededor (se normaliza)', () => {
    expect(validarEmail('  Ana@Gmail.COM ')).toBeNull()
  })

  it.each([
    ['', 'Escribe tu correo electrónico.'],
    [`${'a'.repeat(71)}@gmail.com`, 'Tu correo puede tener hasta 80 caracteres.']
  ])('rechaza %j', (email, error) => expect(validarEmail(email)).toBe(error))

  it.each([
    'ana',
    'ana@',
    '@gmail.com',
    'ana@gmail',
    'ana@gmail.',
    'ana@gmail.c',
    'ana@@gmail.com',
    'ana..lopez@gmail.com',
    '.ana@gmail.com',
    'ana.@gmail.com',
    'ana@-gmail.com',
    'ana@gmail..com',
    'ana lopez@gmail.com',
    'ana@gmail.com.',
    'ñandú@gmail.com'
  ])('rechaza el formato %s', (email) => {
    expect(validarEmail(email)).toBe('Revisa tu correo; debe verse como nombre@correo.com.')
  })

  it('limpia lo que se escribe', () => {
    expect(limpiarEmail(' Ana @Gmail.Com ')).toBe('ana@gmail.com')
    expect(limpiarEmail('a'.repeat(90))).toHaveLength(80)
  })
})

describe('teléfono', () => {
  it('acepta exactamente 10 dígitos', () => {
    expect(validarTelefono('5512345678')).toBeNull()
  })

  it.each([
    ['', 'Escribe tu teléfono.'],
    ['551234567', 'Tu teléfono debe tener 10 dígitos (te falta 1).'],
    ['55', 'Tu teléfono debe tener 10 dígitos (te faltan 8).'],
    ['55123456789', 'Tu teléfono debe tener 10 dígitos.'],
    ['55 1234 5678', 'Usa solo números en tu teléfono.'],
    ['55-1234-567', 'Usa solo números en tu teléfono.']
  ])('rechaza %j', (telefono, error) => expect(validarTelefono(telefono)).toBe(error))

  it('limpia lo que se escribe', () => {
    expect(limpiarTelefono('(55) 1234-5678')).toBe('5512345678')
    expect(limpiarTelefono('551234567899')).toBe('5512345678')
  })
})

describe('registro completo', () => {
  const valido = {
    nombre: 'Ana Sofía',
    apellido: 'López García',
    email: 'ana@gmail.com',
    telefono: '5512345678',
    aceptoPrivacidad: true
  }

  it('es válido con todos los campos correctos', () => {
    expect(esRegistroValido(validarRegistro(valido))).toBe(true)
  })

  it('exige aceptar el aviso de privacidad', () => {
    const errores = validarRegistro({ ...valido, aceptoPrivacidad: false })
    expect(errores.aceptoPrivacidad).toBe('Acepta el aviso de privacidad para continuar.')
    expect(esRegistroValido(errores)).toBe(false)
  })

  it('reporta el error de cada campo por separado', () => {
    const errores = validarRegistro({ ...valido, apellido: '', email: 'ana@', telefono: '55' })
    expect(errores.nombre).toBeNull()
    expect(errores.apellido).toBe('Escribe tu apellido.')
    expect(errores.email).not.toBeNull()
    expect(errores.telefono).not.toBeNull()
  })

  it('normaliza nombre y correo para guardar', () => {
    expect(
      normalizarRegistro({
        ...valido,
        nombre: '  Ana   Sofía ',
        apellido: ' López  García ',
        email: ' Ana@Gmail.COM '
      })
    ).toEqual(valido)
  })
})
