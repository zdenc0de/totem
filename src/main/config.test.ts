import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { CONTENIDO_POR_DEFECTO, type Contenido } from '@shared/content'
import { cargarContenido, generarQrs } from './config'

let dir: string
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), 'totem-config-'))))
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const conFrase = (frase: string): Contenido => ({
  ...CONTENIDO_POR_DEFECTO,
  talentos: { ...CONTENIDO_POR_DEFECTO.talentos, A: { nombre: 'Talento Acelerador', frase } }
})

function escribir(nombre: string, valor: unknown): string {
  const ruta = join(dir, nombre)
  writeFileSync(ruta, typeof valor === 'string' ? valor : JSON.stringify(valor))
  return ruta
}

describe('cargarContenido', () => {
  it('usa el primer archivo válido', () => {
    const usuario = escribir('usuario.json', conFrase('del usuario'))
    const empaquetado = escribir('empaquetado.json', conFrase('empaquetada'))
    expect(cargarContenido([usuario, empaquetado]).contenido.talentos.A.frase).toBe('del usuario')
  })

  it('salta archivos que no existen, que no son JSON o que no cumplen el esquema', () => {
    const roto = escribir('roto.json', '{ "talentos": ')
    const invalido = escribir('invalido.json', {
      ...CONTENIDO_POR_DEFECTO,
      adminPinDefault: 'PENDIENTE'
    })
    const bueno = escribir('bueno.json', conFrase('buena'))
    const r = cargarContenido([join(dir, 'no-existe.json'), roto, invalido, bueno])
    expect(r.contenido.talentos.A.frase).toBe('buena')
    expect(r.dirBase).toBe(dir)
  })

  it('sin archivos válidos usa los valores por defecto', () => {
    expect(cargarContenido([escribir('roto.json', '[]')])).toEqual({
      contenido: CONTENIDO_POR_DEFECTO,
      dirBase: null
    })
  })
})

describe('generarQrs', () => {
  const conJuegos = (juegos: Contenido['juegos']): Contenido => ({
    ...CONTENIDO_POR_DEFECTO,
    juegos
  })

  it('genera un PNG desde la URL y deja null lo pendiente', async () => {
    const contenido = conJuegos({
      simulador: { nombre: 'Simulador', qrUrl: 'https://ejemplo.com/simulador.jpg', qrImage: null },
      pera: { nombre: 'Pera', qrUrl: 'PENDIENTE', qrImage: null }
    })
    const qr = await generarQrs({ contenido, dirBase: null })
    expect(qr.simulador).toMatch(/^data:image\/png;base64,/)
    expect(qr.pera).toBeNull()
  })

  it('una imagen de QR tiene prioridad sobre la URL y se resuelve junto al content.json', async () => {
    writeFileSync(join(dir, 'pera.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    const contenido = conJuegos({
      simulador: { nombre: 'Simulador', qrUrl: 'javascript:alert(1)', qrImage: null },
      pera: { nombre: 'Pera', qrUrl: 'https://ejemplo.com/pera.jpg', qrImage: 'pera.png' }
    })
    const qr = await generarQrs({ contenido, dirBase: dir })
    expect(qr.pera).toBe('data:image/png;base64,iVBORw==')
    expect(qr.simulador).toBeNull()
  })
})
