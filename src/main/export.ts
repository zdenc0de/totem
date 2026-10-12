// Exportación de registros (CLAUDE.md §11): .xlsx con exceljs y .csv UTF-8 con BOM,
// con el mismo nombre base, a la carpeta que se elija (la USB).
import { closeSync, fsyncSync, openSync, writeSync } from 'fs'
import { join } from 'path'
import ExcelJS from 'exceljs'
import type { Contenido } from '@shared/content'
import type { Registro, TotemId } from '@shared/types'
import { selloArchivo } from '@shared/fecha'

type Celda = string | number

export type Tabla = { encabezados: string[]; filas: Celda[][] }

const siNo = (v: boolean): string => (v ? 'Sí' : 'No')

const COLUMNAS: [string, (r: Registro, c: Contenido) => Celda][] = [
  ['ID', (r) => r.id],
  // La columna del tótem sirve para detectar duplicados al unir los archivos de T1 y T2.
  ['Tótem', (r) => r.totemId],
  ['Fecha', (r) => r.createdAt],
  ['Nombre(s)', (r) => r.nombre],
  ['Apellido', (r) => r.apellido],
  ['Correo', (r) => r.email],
  ['Teléfono', (r) => r.telefono],
  ['Aceptó privacidad', (r) => siNo(r.aceptoPrivacidad)],
  ['Versión del aviso', (r) => r.privacyVersion],
  ...[0, 1, 2, 3, 4].map((i): [string, (r: Registro) => Celda] => [
    `Q${i + 1}`,
    (r) => r.respuestas[i] ?? ''
  ]),
  ['Conteo A', (r) => r.conteo.A],
  ['Conteo I', (r) => r.conteo.I],
  ['Conteo V', (r) => r.conteo.V],
  ['Talento', (r) => r.talento],
  ['Talento (nombre)', (r, c) => c.talentos[r.talento]?.nombre ?? r.talento],
  ['Juego', (r) => r.juego],
  ['Juego (nombre)', (r, c) => c.juegos[r.juego]?.nombre ?? r.juego],
  ['Desempate', (r) => siNo(r.desempate)],
  ['Duración (s)', (r) => r.duracionSeg]
]

export function tablaExport(registros: Registro[], contenido: Contenido): Tabla {
  const ordenados = [...registros].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  return {
    encabezados: COLUMNAS.map(([titulo]) => titulo),
    filas: ordenados.map((r) => COLUMNAS.map(([, valor]) => valor(r, contenido)))
  }
}

export function nombreExport(totemId: TotemId, fecha: Date): string {
  return `registros_${totemId}_${selloArchivo(fecha)}`
}

/**
 * CSV para Excel: BOM UTF-8 (acentos y ñ correctos), CRLF y comillas cuando hace falta.
 * Las celdas que empiezan con = + - @ llevan ' al inicio para que Excel no las tome como fórmula.
 */
export function aCsv({ encabezados, filas }: Tabla): string {
  const celda = (v: Celda): string => {
    let s = String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return (
    '﻿' + [encabezados, ...filas].map((fila) => fila.map(celda).join(',')).join('\r\n') + '\r\n'
  )
}

export async function aXlsx({ encabezados, filas }: Tabla): Promise<Buffer> {
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Registros', { views: [{ state: 'frozen', ySplit: 1 }] })
  hoja.addRow(encabezados).font = { bold: true }
  for (const fila of filas) hoja.addRow(fila)
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: encabezados.length } }
  hoja.columns.forEach((col, i) => {
    const largo = Math.max(encabezados[i].length, ...filas.map((f) => String(f[i]).length))
    col.width = Math.min(Math.max(largo + 2, 6), 48)
  })
  return Buffer.from(await libro.xlsx.writeBuffer())
}

/** Escribe .xlsx y .csv en `carpeta`; cada uno con fsync para que la USB se pueda retirar. */
export async function escribirExport(
  carpeta: string,
  nombreBase: string,
  tabla: Tabla
): Promise<string[]> {
  const archivos: [string, Buffer][] = [
    [`${nombreBase}.xlsx`, await aXlsx(tabla)],
    [`${nombreBase}.csv`, Buffer.from(aCsv(tabla), 'utf8')]
  ]
  for (const [nombre, datos] of archivos) {
    const fd = openSync(join(carpeta, nombre), 'w')
    try {
      writeSync(fd, datos)
      fsyncSync(fd)
    } finally {
      closeSync(fd)
    }
  }
  return archivos.map(([nombre]) => nombre)
}
