// Revisión estática de la restricción "cero internet en el tótem" (CLAUDE.md §2).
// Complementa el bloqueo en tiempo de ejecución (net-policy + CSP).
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'
import { describe, expect, it } from 'vitest'

const RAIZ = join(__dirname, '..')
const CSP_ESPERADA =
  "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'"

function archivosFuente(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre)
    if (statSync(ruta).isDirectory()) return archivosFuente(ruta)
    const esFuente = /\.(ts|tsx|css|html)$/.test(nombre) && !/\.test\.ts$/.test(nombre)
    return esFuente ? [ruta] : []
  })
}

describe('sin red', () => {
  it('index.html declara exactamente la CSP estricta', () => {
    const html = readFileSync(join(RAIZ, 'src/renderer/index.html'), 'utf8')
    const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1]
    expect(csp).toBe(CSP_ESPERADA)
  })

  it('ningún archivo del código fuente referencia URLs remotas', () => {
    const remotas = /\b(https?|wss?):\/\/(?!localhost[:/])[^\s'"`)]+/g
    const hallazgos = archivosFuente(join(RAIZ, 'src')).flatMap((ruta) => {
      const texto = readFileSync(ruta, 'utf8')
      return [...texto.matchAll(remotas)].map((m) => `${relative(RAIZ, ruta)}: ${m[0]}`)
    })
    expect(hallazgos).toEqual([])
  })

  it('no hay configuración de auto-update', () => {
    const builder = readFileSync(join(RAIZ, 'electron-builder.yml'), 'utf8')
    expect(builder).not.toMatch(/^publish:/m)
    const pkg = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(Object.keys(deps)).not.toContain('electron-updater')
  })
})
