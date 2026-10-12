/**
 * Primer nombre capitalizado para el boleto (CLAUDE.md §7): "zDENKO" → "Zdenko",
 * "maría-josé" → "María-José". La mayúscula va al inicio y después de guion o apóstrofe.
 */
export function primerNombre(nombre: string): string {
  const primero = nombre.trim().split(/\s+/)[0] ?? ''
  return primero
    .toLocaleLowerCase('es-MX')
    .replace(
      /(^|[-'’])(\p{L})/gu,
      (_, antes: string, letra: string) => antes + letra.toLocaleUpperCase('es-MX')
    )
}
