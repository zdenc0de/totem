import { createContext, useContext } from 'react'
import type { ConfigRenderer } from '@shared/content'

// Textos, tiempos, reglas y QR de content.json; App lo carga una vez al arrancar.
export const ContenidoContext = createContext<ConfigRenderer | null>(null)

export function useContenido(): ConfigRenderer {
  const contenido = useContext(ContenidoContext)
  if (!contenido) throw new Error('useContenido fuera de ContenidoContext')
  return contenido
}
