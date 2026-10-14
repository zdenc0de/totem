// Guía flotante para quien revisa la demo. Vive fuera de la app (no es parte del tótem).
import { reiniciarDemo } from './simulador'

const PASOS = [
  'Es la app del tótem tal cual (pantalla vertical de 1080×1920, escalada a tu ventana). En el evento se usa con el dedo.',
  'Toca la pantalla de inicio para comenzar: registro con teclado en pantalla, 5 preguntas y tu boleto con QR.',
  'El QR del boleto abre en el celular la imagen de tu talento para guardarla o subirla a una historia.',
  'Si no tocas nada en 45 s aparece "¿Sigues ahí?"; el boleto vuelve solo al inicio en 60 s.',
  'Panel de administrador: en la pantalla de inicio, 5 toques rápidos en la esquina superior izquierda. PIN: 1234.',
  '"Exportar a USB" descarga el Excel y el CSV tal como salen en el tótem.',
  'Los datos que escribas se quedan solo en este navegador.'
]

const estilos = `
.guia-demo { position: fixed; top: 12px; right: 12px; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end; font-family: 'Poppins', system-ui, sans-serif; color: #fff; user-select: text; -webkit-user-select: text; }
.guia-demo__abrir { border: 0; border-radius: 999px; padding: 10px 16px; font-family: inherit; font-size: 14px; font-weight: 800; line-height: 1; color: #083a73; background: #ffed00; box-shadow: 0 4px 16px rgba(0,0,0,.35); cursor: pointer; }
.guia-demo__panel { margin-top: 8px; width: min(360px, calc(100vw - 24px)); max-height: calc(100dvh - 80px); overflow: auto; padding: 16px 18px; border-radius: 16px; background: rgba(8, 58, 115, .97); box-shadow: 0 8px 32px rgba(0,0,0,.45); font-size: 14px; line-height: 1.45; }
.guia-demo__panel h2 { margin: 0 0 8px; font-size: 16px; font-weight: 800; }
.guia-demo__panel ol { margin: 0 0 12px; padding-left: 20px; }
.guia-demo__panel li { margin-bottom: 6px; }
.guia-demo__reiniciar { border: 2px solid #fff; border-radius: 999px; padding: 8px 14px; font-family: inherit; font-size: 13px; font-weight: 700; line-height: 1; color: #fff; background: transparent; cursor: pointer; }
`

function montar(): void {
  const css = document.createElement('style')
  css.textContent = estilos
  document.head.appendChild(css)

  const raiz = document.createElement('div')
  raiz.className = 'guia-demo'
  // La app bloquea el menú contextual y la selección; aquí sí se puede leer y copiar.
  raiz.addEventListener('contextmenu', (e) => e.stopPropagation())

  const abrir = document.createElement('button')
  abrir.className = 'guia-demo__abrir'
  abrir.type = 'button'
  abrir.setAttribute('aria-expanded', 'false')

  const panel = document.createElement('div')
  panel.className = 'guia-demo__panel'
  const titulo = document.createElement('h2')
  titulo.textContent = 'Demo para revisión'
  const lista = document.createElement('ol')
  for (const paso of PASOS) {
    const li = document.createElement('li')
    li.textContent = paso
    lista.appendChild(li)
  }
  const reiniciar = document.createElement('button')
  reiniciar.className = 'guia-demo__reiniciar'
  reiniciar.type = 'button'
  reiniciar.textContent = 'Borrar mis registros de prueba'
  reiniciar.addEventListener('click', reiniciarDemo)
  panel.append(titulo, lista, reiniciar)

  let visible = false
  try {
    visible = localStorage.getItem('totem-demo:guia-vista') !== '1'
  } catch {
    visible = true
  }
  const pintar = (): void => {
    panel.hidden = !visible
    abrir.textContent = visible ? 'Cerrar guía' : 'Guía de la demo'
    abrir.setAttribute('aria-expanded', String(visible))
  }
  abrir.addEventListener('click', () => {
    visible = !visible
    try {
      localStorage.setItem('totem-demo:guia-vista', '1')
    } catch {
      // Sin almacenamiento: la guía vuelve a abrirse en la siguiente visita.
    }
    pintar()
  })
  pintar()

  raiz.append(abrir, panel)
  document.body.appendChild(raiz)
}

montar()
