import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import ExcelJS from 'exceljs'
import type { Registro } from '@shared/types'
import { CONTENIDO_POR_DEFECTO } from '@shared/content'
import { aCsv, escribirExport, nombreExport, tablaExport } from './export'

let dir: string
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), 'totem-export-'))))
afterEach(() => rmSync(dir, { recursive: true, force: true }))

function registro(cambios: Partial<Registro>): Registro {
  return {
    id: 'id-1',
    totemId: 'T1',
    createdAt: '2026-10-18T10:00:00-06:00',
    nombre: 'María José',
    apellido: 'Núñez Peña',
    email: 'maria@correo.com',
    telefono: '5512345678',
    aceptoPrivacidad: true,
    privacyVersion: 'v1',
    respuestas: ['V', 'V', 'V', 'A', 'I'],
    conteo: { A: 1, I: 1, V: 3 },
    talento: 'V',
    juego: 'simulador',
    desempate: false,
    duracionSeg: 42,
    ...cambios
  }
}

const tabla = tablaExport(
  [registro({ id: 'id-2', createdAt: '2026-10-18T11:00:00-06:00' }), registro({})],
  CONTENIDO_POR_DEFECTO
)

describe('tablaExport', () => {
  it('trae todos los campos, Q1..Q5 y nombres legibles, ordenado por fecha', () => {
    expect(tabla.encabezados).toEqual([
      'ID',
      'Tótem',
      'Fecha',
      'Nombre(s)',
      'Apellido',
      'Correo',
      'Teléfono',
      'Aceptó privacidad',
      'Versión del aviso',
      'Q1',
      'Q2',
      'Q3',
      'Q4',
      'Q5',
      'Conteo A',
      'Conteo I',
      'Conteo V',
      'Talento',
      'Talento (nombre)',
      'Juego',
      'Juego (nombre)',
      'Desempate',
      'Duración (s)'
    ])
    expect(tabla.filas.map((f) => f[0])).toEqual(['id-1', 'id-2'])
    expect(tabla.filas[0]).toEqual([
      'id-1',
      'T1',
      '2026-10-18T10:00:00-06:00',
      'María José',
      'Núñez Peña',
      'maria@correo.com',
      '5512345678',
      'Sí',
      'v1',
      'V',
      'V',
      'V',
      'A',
      'I',
      1,
      1,
      3,
      'V',
      'Reflejo',
      'simulador',
      'Simulador de carreras',
      'No',
      42
    ])
  })
})

describe('aCsv', () => {
  it('empieza con BOM, usa CRLF y escapa comas y comillas', () => {
    const csv = aCsv({ encabezados: ['a', 'b'], filas: [['Peña, "La"', 'x']] })
    expect(csv.startsWith('﻿a,b\r\n')).toBe(true)
    expect(csv).toContain('"Peña, ""La""",x\r\n')
  })

  it.each(['=1+1', '+52', '-Ana', '@sum'])('neutraliza la fórmula %s', (valor) => {
    expect(aCsv({ encabezados: ['a'], filas: [[valor]] }).split('\r\n')[1]).toBe(`'${valor}`)
  })
})

describe('nombreExport', () => {
  it('sigue registros_{T1}_{YYYY-MM-DD_HHmm}', () => {
    expect(nombreExport('T2', new Date(2026, 9, 18, 9, 5))).toBe('registros_T2_2026-10-18_0905')
  })
})

describe('escribirExport', () => {
  it('escribe el .xlsx y el .csv con acentos y ñ correctos', async () => {
    const archivos = await escribirExport(dir, 'registros_T1_prueba', tabla)
    expect(archivos).toEqual(['registros_T1_prueba.xlsx', 'registros_T1_prueba.csv'])

    const csv = readFileSync(join(dir, archivos[1]), 'utf8')
    expect(csv).toContain('María José,Núñez Peña')

    const libro = new ExcelJS.Workbook()
    await libro.xlsx.readFile(join(dir, archivos[0]))
    const hoja = libro.getWorksheet('Registros')!
    expect(hoja.rowCount).toBe(3)
    expect(hoja.getRow(2).getCell(4).value).toBe('María José')
    expect(hoja.getRow(2).getCell(5).value).toBe('Núñez Peña')
    expect(hoja.getRow(2).getCell(7).value).toBe('5512345678')
  })
})
