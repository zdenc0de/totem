// La demo no tiene disco: cualquier intento de usarlo es un error de programación.
const sinDisco = (): never => {
  throw new Error('La demo web no escribe en disco')
}

export const closeSync = sinDisco
export const existsSync = (): boolean => false
export const fsyncSync = sinDisco
export const mkdirSync = sinDisco
export const openSync = sinDisco
export const readFileSync = sinDisco
export const renameSync = sinDisco
export const writeSync = sinDisco
