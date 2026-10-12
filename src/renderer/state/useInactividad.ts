// Temporizador de inactividad (CLAUDE.md §4):
// - REGISTRO y QUIZ: tras `inactividadSeg` sin toques aparece "¿Sigues ahí?" con una cuenta de
//   `avisoInactividadSeg`; si nadie toca, se borra todo y se vuelve a IDLE.
// - ADMIN: se cierra directo a IDLE tras `inactividadSeg`.
// - BOLETO tiene su propio temporizador; IDLE y CALCULANDO no se vigilan.
import { useEffect, useRef, useState, type Dispatch } from 'react'
import type { ConfigRenderer } from '@shared/content'
import type { FlowAction, Pantalla } from './flow'

/** Cuenta como actividad aunque no haya toques (p. ej. con el diálogo de exportación abierto). */
export const EVENTO_ACTIVIDAD = 'totem:actividad'

/** Segundos que quedan del aviso; `null` mientras no haya aviso. */
export function useInactividad(
  pantalla: Pantalla,
  tiempos: ConfigRenderer['tiempos'],
  dispatch: Dispatch<FlowAction>
): number | null {
  const conAviso = pantalla === 'registro' || pantalla === 'quiz'
  const vigilada = conAviso || pantalla === 'admin'
  const [restante, setRestante] = useState<number | null>(null)
  const ultimoToque = useRef(0)

  useEffect(() => {
    if (!vigilada) return
    ultimoToque.current = Date.now()

    const tocar = (): void => {
      ultimoToque.current = Date.now()
      setRestante(null)
    }
    const reloj = setInterval(() => {
      const quietoSeg = (Date.now() - ultimoToque.current) / 1000
      if (quietoSeg < tiempos.inactividadSeg) return
      if (!conAviso) return dispatch({ type: 'CERRAR_ADMIN' })
      const queda = Math.ceil(tiempos.inactividadSeg + tiempos.avisoInactividadSeg - quietoSeg)
      if (queda <= 0) dispatch({ type: 'REINICIAR' })
      else setRestante(queda)
    }, 250)

    // En captura: cuenta aunque un componente detenga la propagación del toque.
    window.addEventListener('pointerdown', tocar, true)
    window.addEventListener('keydown', tocar, true)
    window.addEventListener(EVENTO_ACTIVIDAD, tocar)
    return () => {
      setRestante(null)
      clearInterval(reloj)
      window.removeEventListener('pointerdown', tocar, true)
      window.removeEventListener('keydown', tocar, true)
      window.removeEventListener(EVENTO_ACTIVIDAD, tocar)
    }
  }, [vigilada, conAviso, tiempos, dispatch])

  return vigilada ? restante : null
}
