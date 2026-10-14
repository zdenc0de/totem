// Guardar la imagen del boleto o compartirla en una historia de Instagram.
//
// Ninguna página web puede publicar directo en Instagram: se usa el menú de compartir del
// celular (Web Share API con archivos), donde el participante elige Instagram → Historia.
// Si el navegador no lo permite, se descarga la imagen y se explica cómo subirla.
;(() => {
  const talento = document.body.dataset.talento
  const url = `/assets/img/retos/${talento}.jpg`
  const nombreArchivo = `conaip-eliot-${talento}.jpg`
  const aviso = document.getElementById('aviso')
  const esIOS =
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  // Se descarga al abrir la página: Safari solo deja abrir el menú de compartir si se llama
  // justo después del toque, sin esperar a la red.
  let archivo = null
  fetch(url)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
    .then((b) => (archivo = new File([b], nombreArchivo, { type: 'image/jpeg' })))
    .catch(() => {})

  const decir = (texto) => (aviso.textContent = texto)

  /** `true` si se abrió el menú de compartir (aunque el usuario lo cierre). */
  async function compartir() {
    if (!archivo || !navigator.canShare || !navigator.canShare({ files: [archivo] })) return false
    try {
      await navigator.share({ files: [archivo] })
      return true
    } catch (err) {
      // El usuario cerró el menú: no es un error.
      return err && err.name === 'AbortError'
    }
  }

  function descargar() {
    // Con el archivo ya precargado, el nombre de la descarga es el que ponemos aquí.
    const href = archivo ? URL.createObjectURL(archivo) : url
    const a = document.createElement('a')
    a.href = href
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    if (archivo) setTimeout(() => URL.revokeObjectURL(href), 10_000)
  }

  document.getElementById('historia').addEventListener('click', async () => {
    decir('En el menú, elige Instagram y luego «Historia».')
    if (await compartir()) return
    descargar()
    decir('Descargamos tu imagen. Abre Instagram, crea una historia y elígela de tu galería.')
  })

  document.getElementById('guardar').addEventListener('click', async () => {
    if (esIOS) {
      // En iPhone una descarga va a «Archivos»; el menú de compartir la guarda en Fotos.
      decir('En el menú, toca «Guardar imagen».')
      if (await compartir()) return
      decir('Mantén presionada la imagen y toca «Guardar en Fotos».')
      return
    }
    descargar()
    decir('Listo: la imagen está en tus descargas.')
  })
})()
