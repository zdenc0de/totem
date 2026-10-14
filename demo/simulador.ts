// Simulador de window.totem para la demo web. Reutiliza la lógica real del proceso principal
// (armarRegistro, generarQrs, tablaExport/aCsv/aXlsx); lo único simulado es el disco y la USB:
// los registros se guardan en el navegador de quien revisa y "Exportar a USB" descarga los archivos.
import type { TotemApi } from '../src/preload/index'
import type { EstadoAdmin } from '@shared/ipc'
import type { Contenido } from '@shared/content'
import type { Registro, TotemId } from '@shared/types'
import { normalizarEmail } from '@shared/validation'
import { isoLocal } from '@shared/fecha'
import { armarRegistro } from '../src/main/registro'
import { generarQrs } from '../src/main/config'
import { aCsv, aXlsx, nombreExport, tablaExport } from '../src/main/export'
import contenidoJson from '../resources/content.json'

const contenido = contenidoJson as Contenido
const CLAVE_REGISTROS = 'totem-demo:registros'
const CLAVE_AJUSTES = 'totem-demo:ajustes'

type Ajustes = { totemId: TotemId; idConfirmado: boolean; pin: string | null }

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const v = localStorage.getItem(clave)
    return v ? (JSON.parse(v) as T) : porDefecto
  } catch {
    return porDefecto
  }
}

function escribir(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    // Sin almacenamiento (modo privado): la demo sigue, solo no recuerda entre visitas.
  }
}

let registros: Registro[] = leer(CLAVE_REGISTROS, [])
let ajustes: Ajustes = leer(CLAVE_AJUSTES, { totemId: 'T1', idConfirmado: false, pin: null })
const qrs = generarQrs({ contenido, dirBase: null })

const guardarAjustes = (cambios: Partial<Ajustes>): void => {
  ajustes = { ...ajustes, ...cambios }
  escribir(CLAVE_AJUSTES, ajustes)
}

// exceljs del navegador entrega un ArrayBuffer; aXlsx lo envuelve con Buffer.from (de Node).
const g = globalThis as { Buffer?: { from: (d: ArrayBuffer) => Uint8Array } }
g.Buffer ??= { from: (d) => new Uint8Array(d) }

function descargar(nombre: string, datos: BlobPart, tipo: string): void {
  const url = URL.createObjectURL(new Blob([datos], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const api: TotemApi = {
  getConfig: async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { adminPinDefault, ...resto } = contenido
    return { ...resto, qr: await qrs }
  },

  existeDuplicado: async ({ email, telefono }) => ({
    email: registros.some((r) => r.email === normalizarEmail(email)),
    telefono: registros.some((r) => r.telefono === telefono)
  }),

  guardarRegistro: async (datos) => {
    const armado = armarRegistro(datos, {
      id: crypto.randomUUID(),
      totemId: ajustes.totemId,
      privacyVersion: contenido.privacidad.version,
      reglas: contenido.reglas,
      ahora: new Date()
    })
    if ('error' in armado) return { guardado: false, resultado: null }
    const { registro, resultado } = armado
    const repetido = registros.some(
      (r) => r.email === registro.email || r.telefono === registro.telefono
    )
    if (repetido) return { guardado: false, resultado }
    registros = [...registros, registro]
    escribir(CLAVE_REGISTROS, registros)
    return { guardado: true, resultado }
  },

  alertaSistema: async () => false,

  admin: {
    verificarPin: async (pin) => pin === (ajustes.pin ?? contenido.adminPinDefault),
    bloquear: async () => {},

    estado: async (): Promise<EstadoAdmin> => {
      const porTalento = { A: 0, I: 0, V: 0 }
      const porJuego = { simulador: 0, pera: 0 }
      for (const r of registros) {
        porTalento[r.talento]++
        porJuego[r.juego]++
      }
      const qr = await qrs
      return {
        total: registros.length,
        porTalento,
        porJuego,
        totemId: ajustes.totemId,
        idConfirmado: ajustes.idConfirmado,
        pinDeFabrica: ajustes.pin === null,
        qrPendiente: (['A', 'I', 'V'] as const).filter((t) => !qr[t]),
        // En la demo la USB de respaldo siempre está conectada y al día.
        respaldo: {
          unidad: 'E:\\',
          error: null,
          registros: registros.length,
          enUsb: registros.length,
          excelActualizado: registros.length ? isoLocal(new Date()) : null
        },
        fallosGuardado: 0,
        ahora: isoLocal(new Date())
      }
    },

    cambiarPin: async (pin) => {
      if (!/^\d{4,8}$/.test(pin)) return false
      guardarAjustes({ pin })
      return true
    },

    setTotemId: async (id) => {
      guardarAjustes({ totemId: id, idConfirmado: true })
      return true
    },

    // Descarga el .xlsx y el .csv exactamente como los escribe el tótem en la USB.
    exportar: async () => {
      const tabla = tablaExport(registros, contenido)
      const base = nombreExport(ajustes.totemId, new Date())
      const xlsx = (await aXlsx(tabla)) as unknown as Uint8Array<ArrayBuffer>
      descargar(
        `${base}.xlsx`,
        xlsx,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      descargar(`${base}.csv`, aCsv(tabla), 'text/csv;charset=utf-8')
      return { ok: true, total: registros.length, archivos: [`${base}.xlsx`, `${base}.csv`] }
    },

    prepararRespaldo: async () => 'ok',

    // En el tótem cierra la app; en la demo vuelve a empezar.
    salir: async () => location.reload()
  }
}

window.totem = api

/** Borra los registros y ajustes de prueba de este navegador (botón de la guía). */
export function reiniciarDemo(): void {
  try {
    localStorage.removeItem(CLAVE_REGISTROS)
    localStorage.removeItem(CLAVE_AJUSTES)
  } catch {
    // Nada que borrar.
  }
  location.reload()
}
