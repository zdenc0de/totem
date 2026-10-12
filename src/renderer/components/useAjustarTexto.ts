import { useLayoutEffect, type RefObject } from 'react'

/**
 * Baja el tamaño de letra del elemento, de `max` a `min`, hasta que su texto quepa
 * (sin desbordar ni a lo ancho ni a lo alto de su caja). Si ni en `min` cabe, deja que el
 * texto se parta en varias líneas en vez de cortarlo. Se mide en px del artboard:
 * el `transform: scale()` del Stage no afecta a scrollWidth/clientWidth.
 */
export function useAjustarTexto(
  ref: RefObject<HTMLElement | null>,
  texto: string,
  max: number,
  min: number
): void {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // A lo ancho, 1 px de tolerancia (scroll* y client* se redondean por separado). A lo alto,
    // 0.3 em: la tinta de Poppins (acentos, comas) sale un poco del renglón sin que sobre una línea.
    const desborda = (tam: number): boolean =>
      el.scrollWidth - el.clientWidth > 1 || el.scrollHeight - el.clientHeight > tam * 0.3
    const ajustar = (): void => {
      let tam = max
      el.style.whiteSpace = ''
      el.style.fontSize = `${tam}px`
      while (tam > min && desborda(tam)) {
        tam -= 2
        el.style.fontSize = `${tam}px`
      }
      if (desborda(tam)) el.style.whiteSpace = 'normal'
    }
    ajustar()
    // Las fuentes son locales, pero si aún no terminan de cargar se vuelve a medir.
    let vigente = true
    document.fonts?.ready.then(() => vigente && ajustar())
    return () => {
      vigente = false
    }
  }, [ref, texto, max, min])
}
