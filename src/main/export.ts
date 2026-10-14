// Exportación de registros (CLAUDE.md §11): .xlsx con exceljs y .csv UTF-8 con BOM,
// con el mismo nombre base, a la carpeta que se elija (la USB).
import { closeSync, fsyncSync, openSync, renameSync, writeSync } from 'fs'
import { join } from 'path'
import ExcelJS from 'exceljs'
import type { Contenido } from '@shared/content'
import type { Registro, TotemId } from '@shared/types'
import { selloArchivo } from '@shared/fecha'

/** `Fecha` es un día del calendario: en el .xlsx sale como fecha de Excel (se puede filtrar). */
export type Fecha = { anio: number; mes: number; dia: number }
type Celda = string | number | Fecha

export type Tabla = { encabezados: string[]; filas: Celda[][] }

const siNo = (v: boolean): string => (v ? 'Sí' : 'No')
const dos = (n: number): string => String(n).padStart(2, '0')

/**
 * Fecha y hora tal como se registraron en el tótem, leídas del texto ISO (2026-10-18T10:15:00-06:00)
 * para que no cambien con la zona horaria de la computadora que abra el archivo.
 */
function partesFecha(iso: string): { fecha: Fecha | string; hora: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})/.exec(iso)
  if (!m) return { fecha: iso, hora: '' }
  return { fecha: { anio: +m[1], mes: +m[2], dia: +m[3] }, hora: m[4] }
}

const esFecha = (v: Celda): v is Fecha => typeof v === 'object'
const fechaTexto = (f: Fecha): string => `${f.anio}-${dos(f.mes)}-${dos(f.dia)}`

const COLUMNAS: [string, (r: Registro, c: Contenido) => Celda][] = [
  ['ID', (r) => r.id],
  // La columna del tótem sirve para detectar duplicados al unir los archivos de T1 y T2.
  ['Tótem', (r) => r.totemId],
  ['Fecha', (r) => partesFecha(r.createdAt).fecha],
  ['Hora', (r) => partesFecha(r.createdAt).hora],
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
    let s = esFecha(v) ? fechaTexto(v) : String(v)
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
  for (const fila of filas) {
    // Excel guarda fechas sin zona horaria: se construye en UTC para que el día no se mueva.
    hoja.addRow(fila.map((v) => (esFecha(v) ? new Date(Date.UTC(v.anio, v.mes - 1, v.dia)) : v)))
  }
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: encabezados.length } }
  hoja.columns.forEach((col, i) => {
    if (filas.some((f) => esFecha(f[i]))) col.numFmt = 'dd/mm/yyyy'
    const texto = (v: Celda): string => (esFecha(v) ? '00/00/0000' : String(v))
    const largo = Math.max(encabezados[i].length, ...filas.map((f) => texto(f[i]).length))
    col.width = Math.min(Math.max(largo + 2, 6), 48)
  })
  return Buffer.from(await libro.xlsx.writeBuffer())
}

/**
 * Escribe .xlsx y .csv en `carpeta`, cada uno con fsync para que la USB se pueda retirar.
 * Primero a un archivo temporal y luego se renombra: si algo falla a medias (apagón, USB
 * retirada), el archivo anterior con el mismo nombre queda intacto.
 */
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
    const destino = join(carpeta, nombre)
    const temporal = `${destino}.tmp`
    const fd = openSync(temporal, 'w')
    try {
      writeSync(fd, datos)
      fsyncSync(fd)
    } finally {
      closeSync(fd)
    }
    renameSync(temporal, destino)
  }
  return archivos.map(([nombre]) => nombre)
}
