// Lo mínimo de `path` que importan los módulos compartidos con main (rutas con "/").
export const join = (...partes: string[]): string => partes.join('/').replace(/\/+/g, '/')
export const basename = (ruta: string): string => ruta.split(/[\\/]/).pop() ?? ''
export const dirname = (ruta: string): string => ruta.split(/[\\/]/).slice(0, -1).join('/')
export const extname = (ruta: string): string => /\.[^./\\]*$/.exec(ruta)?.[0] ?? ''
export const isAbsolute = (ruta: string): boolean => /^([a-zA-Z]:)?[\\/]/.test(ruta)
export const parse = (ruta: string): { root: string } => ({
  root: /^([a-zA-Z]:[\\/]|\/)/.exec(ruta)?.[0] ?? ''
})
