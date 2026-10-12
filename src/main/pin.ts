// PIN de administrador (CLAUDE.md §11). El PIN cambiado se guarda como hash scrypt.
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

export const esPinValido = (pin: unknown): pin is string =>
  typeof pin === 'string' && /^\d{4,8}$/.test(pin)

export function hashPin(pin: string): string {
  const sal = randomBytes(16)
  return `scrypt$${sal.toString('hex')}$${scryptSync(pin, sal, 32).toString('hex')}`
}

/** Compara contra el hash guardado o, si no hay, contra el PIN de fábrica de content.json. */
export function verificarPin(pin: unknown, pinHash: string | null, pinDefault: string): boolean {
  if (!esPinValido(pin)) return false
  if (!pinHash) return iguales(Buffer.from(pin), Buffer.from(pinDefault))
  const [algoritmo, salHex, hashHex] = pinHash.split('$')
  if (algoritmo !== 'scrypt' || !salHex || !hashHex) return false
  const esperado = Buffer.from(hashHex, 'hex')
  return iguales(scryptSync(pin, Buffer.from(salHex, 'hex'), esperado.length), esperado)
}

function iguales(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b)
}
