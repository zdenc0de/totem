import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync
} from 'fs'
import { tmpdir } from 'os'
import { join, parse } from 'path'
import ExcelJS from 'exceljs'
import type { Registro, TotemId } from '@shared/types'
import { CONTENIDO_POR_DEFECTO } from '@shared/content'
import { CARPETA_RESPALDO, crearRespaldo, type OpcionesRespaldo } from './respaldo'

let raiz: string
let usb: string
let registros: Registro[]
let totemId: TotemId

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'totem-respaldo-'))
  usb = join(raiz, 'usb')
  mkdirSync(usb)
  registros = []
  totemId = 'T1'
})
afterEach(() => rmSync(raiz, { recursive: true, force: true }))

function registro(n: number): Registro {
  return {
    id: `id-${n}`,
    totemId: 'T1',
    createdAt: `2026-10-18T10:${String(n % 60).padStart(2, '0')}:00-06:00`,
    nombre: 'Íñigo',
    apellido: "O'Connor Peña",
    email: `persona${n}@correo.com`,
    telefono: String(5500000000 + n),
    aceptoPrivacidad: true,
    privacyVersion: 'v1',
    respuestas: ['A', 'A', 'A', 'I', 'V'],
    conteo: { A: 3, I: 1, V: 1 },
    talento: 'A',
    juego: 'simulador',
    desempate: false,
    duracionSeg: 42
  }
}

const respaldo = (cambios: Partial<OpcionesRespaldo> = {}): ReturnType<typeof crearRespaldo> =>
  crearRespaldo({
    raices: () => [join(raiz, 'no-existe'), usb],
    raizSistema: 'Q:\\',
    registros: () => registros,
    totemId: () => totemId,
    contenido: CONTENIDO_POR_DEFECTO,
    excelCada: 10,
    excelMs: 60_000,
    ...cambios
  })

const dirUsb = (): string => join(usb, CARPETA_RESPALDO)
/** Ids de las líneas válidas del JSONL de la USB (una línea cortada se omite, como hace la app). */
const idsEnUsb = (id: TotemId = 'T1'): string[] =>
  readFileSync(join(dirUsb(), `registros_${id}.jsonl`), 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l).id]
      } catch {
        return []
      }
    })

async function filasExcel(id: TotemId = 'T1'): Promise<number> {
  const libro = new ExcelJS.Workbook()
  await libro.xlsx.readFile(join(dirUsb(), `registros_${id}.xlsx`))
  return libro.getWorksheet('Registros')!.rowCount - 1
}

describe('respaldo en USB', () => {
  it('sin la carpeta TotemRespaldo no escribe nada y lo reporta', async () => {
    const r = respaldo()
    registros.push(registro(1))
    await r.sincronizar()
    expect(readdirSync(usb)).toEqual([])
    expect(r.estado()).toMatchObject({ unidad: null, enUsb: 0, registros: 1 })
  })

  it('copia cada registro y genera el Excel y el CSV', async () => {
    mkdirSync(dirUsb())
    const r = respaldo()
    registros.push(registro(1))
    await r.sincronizar()
    registros.push(registro(2))
    await r.sincronizar()
    expect(idsEnUsb()).toEqual(['id-1', 'id-2'])
    expect(readdirSync(dirUsb()).sort()).toEqual([
      'registros_T1.csv',
      'registros_T1.jsonl',
      'registros_T1.xlsx'
    ])
    expect(r.estado()).toMatchObject({ unidad: usb, error: null, registros: 2, enUsb: 2 })
  })

  it('regenera el Excel cada 10 registros o cuando pasa el tiempo, nunca a medias', async () => {
    mkdirSync(dirUsb())
    let ahora = new Date(2026, 9, 18, 10, 0, 0)
    const r = respaldo({ ahora: () => ahora })
    registros.push(registro(0))
    await r.sincronizar()
    expect(await filasExcel()).toBe(1)

    for (let n = 1; n <= 9; n++) {
      registros.push(registro(n))
      await r.sincronizar()
    }
    // 9 nuevos: todavía no toca (pero el JSONL sí los tiene todos).
    expect(await filasExcel()).toBe(1)
    expect(idsEnUsb()).toHaveLength(10)

    registros.push(registro(10))
    await r.sincronizar()
    expect(await filasExcel()).toBe(11)

    registros.push(registro(11))
    await r.sincronizar()
    expect(await filasExcel()).toBe(11)
    ahora = new Date(2026, 9, 18, 10, 1, 1)
    await r.sincronizar()
    expect(await filasExcel()).toBe(12)
    expect(readdirSync(dirUsb()).some((f) => f.endsWith('.tmp'))).toBe(false)
  })

  it('si la USB se desconecta sigue sin error y al volver copia lo que falte', async () => {
    mkdirSync(dirUsb())
    const r = respaldo()
    registros.push(registro(1))
    await r.sincronizar()

    // "Desconectar": la carpeta deja de estar en la unidad.
    const fuera = join(raiz, 'fuera')
    renameSync(dirUsb(), fuera)
    registros.push(registro(2), registro(3))
    await r.sincronizar()
    expect(r.estado()).toMatchObject({ unidad: null, registros: 3 })

    renameSync(fuera, dirUsb())
    await r.sincronizar()
    expect(idsEnUsb()).toEqual(['id-1', 'id-2', 'id-3'])
    expect(await filasExcel()).toBe(3)
    expect(r.estado()).toMatchObject({ unidad: usb, enUsb: 3 })
  })

  it('una USB nueva (o vaciada) recibe todos los registros', async () => {
    mkdirSync(dirUsb())
    const r = respaldo()
    registros.push(registro(1), registro(2))
    await r.sincronizar()
    rmSync(dirUsb(), { recursive: true })
    await r.sincronizar()
    mkdirSync(dirUsb())
    await r.sincronizar()
    expect(idsEnUsb()).toEqual(['id-1', 'id-2'])
  })

  it('tolera una línea cortada en la USB (retirada a media escritura) y no duplica', async () => {
    mkdirSync(dirUsb())
    const r = respaldo()
    registros.push(registro(1))
    await r.sincronizar()
    appendFileSync(join(dirUsb(), 'registros_T1.jsonl'), '{"id":"id-2","nom')

    // Al reconectar, el caché se descarta y se vuelve a leer el archivo.
    const fuera = join(raiz, 'fuera')
    renameSync(dirUsb(), fuera)
    await r.sincronizar()
    renameSync(fuera, dirUsb())
    registros.push(registro(2))
    await r.sincronizar()
    expect(idsEnUsb()).toEqual(['id-1', 'id-2'])
  })

  it('reporta el error de escritura sin lanzar y se recupera solo', async () => {
    mkdirSync(dirUsb())
    const r = respaldo()
    // El JSONL es una carpeta: escribir en él falla.
    mkdirSync(join(dirUsb(), 'registros_T1.jsonl'))
    registros.push(registro(1))
    await expect(r.sincronizar()).resolves.toBeUndefined()
    expect(r.estado().error).not.toBeNull()

    rmSync(join(dirUsb(), 'registros_T1.jsonl'), { recursive: true })
    await r.sincronizar()
    expect(r.estado()).toMatchObject({ error: null, enUsb: 1 })
    expect(idsEnUsb()).toEqual(['id-1'])
  })

  it('peticiones simultáneas no duplican líneas', async () => {
    mkdirSync(dirUsb())
    const r = respaldo()
    const esperas: Promise<void>[] = []
    for (let n = 0; n < 50; n++) {
      registros.push(registro(n))
      esperas.push(r.sincronizar())
    }
    await Promise.all(esperas)
    await r.sincronizar()
    expect(idsEnUsb()).toHaveLength(50)
    expect(new Set(idsEnUsb()).size).toBe(50)
    expect(await filasExcel()).toBe(50)
  })

  it('al cambiar el ID del tótem escribe el archivo del ID nuevo completo', async () => {
    mkdirSync(dirUsb())
    const r = respaldo()
    registros.push(registro(1))
    await r.sincronizar()
    totemId = 'T2'
    await r.sincronizar()
    expect(idsEnUsb('T2')).toEqual(['id-1'])
    expect(existsSync(join(dirUsb(), 'registros_T2.xlsx'))).toBe(true)
  })

  it('nunca usa la unidad del sistema', async () => {
    mkdirSync(dirUsb())
    const r = respaldo({ raizSistema: usb })
    registros.push(registro(1))
    await r.sincronizar()
    expect(r.estado().unidad).toBeNull()
    expect(readdirSync(dirUsb())).toEqual([])
    expect(respaldo({ raizSistema: parse(raiz).root }).preparar(raiz)).toBe('unidad-del-sistema')
  })
})
