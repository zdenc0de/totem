const dos = (n: number): string => String(Math.trunc(Math.abs(n))).padStart(2, '0')

/** ISO 8601 en hora local con su desfase, p. ej. 2026-10-18T10:15:00-06:00 (CLAUDE.md §9). */
export function isoLocal(d: Date): string {
  const desfase = -d.getTimezoneOffset()
  const signo = desfase >= 0 ? '+' : '-'
  const fecha = `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
  const hora = `${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`
  return `${fecha}T${hora}${signo}${dos(desfase / 60)}:${dos(desfase % 60)}`
}

/** Sello para nombres de archivo: YYYY-MM-DD_HHmm en hora local (CLAUDE.md §11). */
export function selloArchivo(d: Date): string {
  const fecha = `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
  return `${fecha}_${dos(d.getHours())}${dos(d.getMinutes())}`
}
