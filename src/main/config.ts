// Lectura y validación de content.json (CLAUDE.md §12) y generación local de los QR (§8).
// Orden: userData/content.json → resources/content.json → valores por defecto.
import { existsSync, readFileSync } from 'fs'
import { basename, dirname, extname, isAbsolute, join } from 'path'
import QRCode from 'qrcode'
import { CONTENIDO_POR_DEFECTO, contenidoSchema, type Contenido } from '@shared/content'
import type { Juego } from '@shared/types'
import { sinLog, type Logger } from './storage'

export type ContenidoCargado = {
  contenido: Contenido
  /** Carpeta del content.json usado; las rutas de `qrImage` son relativas a ella. */
  dirBase: string | null
}

export function cargarContenido(rutas: string[], log: Logger = sinLog): ContenidoCargado {
  for (const ruta of rutas) {
    if (!existsSync(ruta)) continue
    let json: unknown
    try {
      json = JSON.parse(readFileSync(ruta, 'utf8'))
    } catch (err) {
      log.error('content.json no es JSON válido; se ignora', {
        ruta: corta(ruta),
        err: String(err)
      })
      continue
    }
    const r = contenidoSchema.safeParse(json)
    if (r.success) {
      log.info('Contenido cargado', { ruta: corta(ruta) })
      return { contenido: r.data, dirBase: dirname(ruta) }
    }
    const problemas = r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    log.error('content.json no cumple el esquema; se ignora', { ruta: corta(ruta), problemas })
  }
  log.warn('Sin content.json válido; se usan los valores por defecto')
  return { contenido: CONTENIDO_POR_DEFECTO, dirBase: null }
}

// Carpeta y archivo, sin el resto de la ruta: la de userData incluye el usuario de Windows.
const corta = (ruta: string): string => `${basename(dirname(ruta))}/${basename(ruta)}`

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
}

/**
 * Un data URL por juego: la imagen de `qrImage` si existe o un QR generado localmente
 * desde `qrUrl` (sin red). `null` si no hay ninguno válido (el boleto dice "QR pendiente").
 */
export async function generarQrs(
  { contenido, dirBase }: ContenidoCargado,
  log: Logger = sinLog
): Promise<Record<Juego, string | null>> {
  const qr: Record<Juego, string | null> = { simulador: null, pera: null }
  for (const juego of ['simulador', 'pera'] as const) {
    const { qrUrl, qrImage } = contenido.juegos[juego]
    try {
      if (qrImage) {
        qr[juego] = leerImagen(qrImage, dirBase)
      } else if (esUrlWeb(qrUrl)) {
        // Nivel Q (25 %). La tarjeta blanca del boleto completa la zona blanca alrededor del
        // margen de 2 módulos; 920 px es el doble del tamaño en pantalla (460 px).
        qr[juego] = await QRCode.toDataURL(qrUrl, {
          errorCorrectionLevel: 'Q',
          margin: 2,
          width: 920
        })
      }
    } catch (err) {
      log.error('No se pudo preparar el QR', { juego, err: String(err) })
    }
    if (!qr[juego]) log.warn('QR pendiente', { juego })
  }
  return qr
}

function leerImagen(ruta: string, dirBase: string | null): string | null {
  const mime = MIME[extname(ruta).toLowerCase()]
  if (!mime) throw new Error(`Formato de imagen no soportado: ${extname(ruta)}`)
  const completa = isAbsolute(ruta) || !dirBase ? ruta : join(dirBase, ruta)
  return `data:${mime};base64,${readFileSync(completa).toString('base64')}`
}

function esUrlWeb(valor: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(valor).protocol)
  } catch {
    return false
  }
}
