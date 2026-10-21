// Figuras de píxeles (coche, guante, pera…) en el lenguaje de mosaico de Eliot. Cada figura se
// describe con rectángulos en celdas que se pintan en orden y se rasteriza una sola vez.

/** [color, x, y, ancho, alto] en celdas. Lo que se pinta después tapa a lo anterior. */
export type Trazo = [color: string, x: number, y: number, ancho: number, alto: number]

export type Figura = { ancho: number; alto: number; celdas: [number, number, string][] }

export function figura(ancho: number, alto: number, trazos: Trazo[]): Figura {
  const lienzo: (string | null)[] = Array(ancho * alto).fill(null)
  for (const [color, x, y, w, h] of trazos) {
    for (let fy = y; fy < y + h; fy++) {
      for (let fx = x; fx < x + w; fx++) {
        if (fx >= 0 && fx < ancho && fy >= 0 && fy < alto) lienzo[fy * ancho + fx] = color
      }
    }
  }
  const celdas: [number, number, string][] = []
  lienzo.forEach((color, i) => color && celdas.push([i % ancho, Math.floor(i / ancho), color]))
  return { ancho, alto, celdas }
}
