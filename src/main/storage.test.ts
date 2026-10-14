import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { fork } from 'child_process'
import { buildSync } from 'esbuild'
import type { Registro } from '@shared/types'
import { crearStorage, rutasDatos } from './storage'

let dir: string
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), 'totem-storage-'))))
afterEach(() => rmSync(dir, { recursive: true, force: true }))

function registro(n: number, cambios: Partial<Registro> = {}): Registro {
  return {
    id: `id-${n}`,
    totemId: 'T1',
    createdAt: '2026-10-18T10:00:00-06:00',
    nombre: 'Zdenko',
    apellido: 'Núñez',
    email: `persona${n}@correo.com`,
    telefono: String(5500000000 + n),
    aceptoPrivacidad: true,
    privacyVersion: 'v1',
    respuestas: ['A', 'A', 'A', 'I', 'V'],
    conteo: { A: 3, I: 1, V: 1 },
    talento: 'A',
    juego: 'simulador',
    desempate: false,
    duracionSeg: 42,
    ...cambios
  }
}

const lineas = (ruta: string): string[] => readFileSync(ruta, 'utf8').split('\n').filter(Boolean)

describe('storage', () => {
  it('guarda en el principal y en el backup, y recuerda correos y teléfonos al reabrir', () => {
    const s = crearStorage(dir)
    expect(s.guardar(registro(1))).toBe(true)
    const { principal, backup } = rutasDatos(dir)
    expect(lineas(principal)).toHaveLength(1)
    expect(lineas(backup)).toHaveLength(1)

    const otra = crearStorage(dir)
    expect(otra.existe({ email: 'persona1@correo.com', telefono: '0000000000' })).toEqual({
      email: true,
      telefono: false
    })
    expect(otra.existe({ email: 'otro@correo.com', telefono: '5500000001' })).toEqual({
      email: false,
      telefono: true
    })
    expect(otra.leerTodos()).toEqual([registro(1)])
  })

  it('omite una última línea truncada y el siguiente registro no queda pegado a ella', () => {
    const s = crearStorage(dir)
    s.guardar(registro(1))
    const { principal } = rutasDatos(dir)
    appendFileSync(principal, '{"id":"id-2","email":"pers')

    const reabierto = crearStorage(dir)
    expect(reabierto.leerTodos().map((r) => r.id)).toEqual(['id-1'])
    reabierto.guardar(registro(3))
    expect(
      crearStorage(dir)
        .leerTodos()
        .map((r) => r.id)
    ).toEqual(['id-1', 'id-3'])
  })

  it('recupera del backup lo que no llegó al principal', () => {
    const { principal, backup } = rutasDatos(dir)
    crearStorage(dir)
    writeFileSync(principal, JSON.stringify(registro(1)) + '\n')
    writeFileSync(backup, [registro(1), registro(2)].map((r) => JSON.stringify(r) + '\n').join(''))
    expect(
      crearStorage(dir)
        .leerTodos()
        .map((r) => r.id)
    ).toEqual(['id-1', 'id-2'])
  })

  it('guarda 300 registros seguidos sin perder ninguno', () => {
    const s = crearStorage(dir)
    for (let n = 0; n < 300; n++) expect(s.guardar(registro(n))).toBe(true)
    const { principal, backup } = rutasDatos(dir)
    expect(lineas(principal)).toHaveLength(300)
    expect(lineas(backup)).toHaveLength(300)
    expect(crearStorage(dir).leerTodos()).toHaveLength(300)
  })

  it('sobrevive a matar el proceso a mitad de las escrituras', async () => {
    // El hijo corre el storage.ts real, empaquetado al vuelo.
    const script = join(dir, 'fixture.cjs')
    buildSync({
      entryPoints: [join(__dirname, 'storage.fixture.ts')],
      bundle: true,
      platform: 'node',
      outfile: script,
      logLevel: 'silent'
    })
    const datos = join(dir, 'datos')
    const hijo = fork(script, [datos], { stdio: 'ignore' })
    await new Promise<void>((listo) => {
      const vigilar = setInterval(() => {
        try {
          if (lineas(rutasDatos(datos).principal).length >= 50) {
            clearInterval(vigilar)
            hijo.kill('SIGKILL')
            listo()
          }
        } catch {
          // Todavía no existe el archivo.
        }
      }, 5)
    })
    await new Promise((fin) => hijo.once('exit', fin))

    const recuperados = crearStorage(datos).leerTodos()
    expect(recuperados.length).toBeGreaterThanOrEqual(50)
    // Todo lo recuperado está completo y en orden.
    recuperados.forEach((r, i) => expect(r.id).toBe(`id-${i}`))
  })

  it('al arrancar completa la copia a la que le falta un registro (corte entre las dos escrituras)', () => {
    const { principal, backup } = rutasDatos(dir)
    crearStorage(dir)
    // Corte después del principal: el backup no alcanzó el registro 3.
    writeFileSync(principal, [1, 2, 3].map((n) => JSON.stringify(registro(n)) + '\n').join(''))
    writeFileSync(backup, [1, 2].map((n) => JSON.stringify(registro(n)) + '\n').join(''))
    crearStorage(dir)
    expect(lineas(backup).map((l) => JSON.parse(l).id)).toEqual(['id-1', 'id-2', 'id-3'])
    expect(lineas(principal)).toHaveLength(3)

    // Y al revés: al principal le falta uno que sí está en el backup.
    appendFileSync(backup, JSON.stringify(registro(4)) + '\n')
    crearStorage(dir)
    expect(lineas(principal).map((l) => JSON.parse(l).id)).toEqual(['id-1', 'id-2', 'id-3', 'id-4'])
    expect(lineas(backup)).toHaveLength(4)
  })

  it('omite líneas que son JSON pero no son un registro completo', () => {
    const { principal } = rutasDatos(dir)
    crearStorage(dir)
    const incompleto = { id: 'x', email: 'x@correo.com', telefono: '5500000000' }
    const sinRespuestas = { ...registro(2), respuestas: undefined }
    const talentoRaro = { ...registro(3), talento: 'Z' }
    writeFileSync(
      principal,
      [registro(1), incompleto, sinRespuestas, talentoRaro, registro(4)]
        .map((r) => JSON.stringify(r) + '\n')
        .join('')
    )
    expect(
      crearStorage(dir)
        .leerTodos()
        .map((r) => r.id)
    ).toEqual(['id-1', 'id-4'])
  })

  it('cuenta los registros que no se pudieron escribir en ningún archivo', () => {
    const s = crearStorage(dir)
    expect(s.guardar(registro(1))).toBe(true)
    // Ambos archivos se vuelven carpetas: cualquier escritura falla.
    const { principal, backup } = rutasDatos(dir)
    for (const ruta of [principal, backup]) {
      rmSync(ruta)
      mkdirSync(ruta)
    }
    expect(s.guardar(registro(2))).toBe(false)
    expect(s.fallos()).toBe(1)
    // El que falló no cuenta como duplicado: esa persona puede volver a intentarlo.
    expect(s.existe({ email: 'persona2@correo.com', telefono: '0' }).email).toBe(false)
  })
})
