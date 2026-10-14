# Totem Talento

App de kiosco para el Quiz de Talento CONAIP × Eliot Awards. La especificación completa está en [AGENTS.md](AGENTS.md).

## Desarrollo

```bash
npm install
npm run dev          # ventana 540×960 con HMR y barra para saltar entre pantallas
npm test             # pruebas unitarias (Vitest)
npm run typecheck
npm run lint
```

- En desarrollo la app abre en ventana normal. Para probar el modo kiosco: `TOTEM_KIOSK=1 npm run dev`.
- Atajos solo de desarrollo: `F12` DevTools, `Ctrl+R` recargar, `Ctrl+Shift+Q` salir (sirve también en modo kiosco).
- Panel de administrador: 5 toques en la esquina superior izquierda en menos de 3 s, desde la pantalla de inicio. PIN de fábrica: `1234` (se cambia desde el panel).
- Abrir directo en una pantalla con datos de ejemplo: `TOTEM_PANTALLA=boleto TOTEM_NOMBRE="María José" npm run dev` (`idle`, `registro`, `quiz`, `calculando`, `boleto` o `admin`).
- `TOTEM_EXPORT_DIR=/ruta` hace que "Exportar a USB" escriba ahí sin abrir el diálogo (solo desarrollo, para pruebas).
- Si Electron arranca como Node (`Cannot read properties of undefined (reading 'isPackaged')`), la terminal tiene `ELECTRON_RUN_AS_NODE=1` (pasa en algunas terminales integradas). Quítala antes de correr la app.

## Build para Windows

```bash
npm run build:win    # instalador NSIS x64 en dist/
```

## Datos y logs

Todo vive en `%APPDATA%\Totem Talento\`:

- `data\registros.jsonl`: un registro por línea, escrito con fsync al terminar el quiz.
- `data\backup\registros_backup.jsonl`: copia espejo, escrita al mismo tiempo.
- `data\settings.json`: ID del tótem (T1/T2) y hash del PIN si se cambió.
- `logs\`: un archivo por día. Nunca contienen datos personales.

### USB de respaldo (en tiempo real)

Cada tótem lleva una USB fija con la carpeta `TotemRespaldo` en su raíz (se crea desde el panel con "Preparar USB"). Ahí se mantienen:

- `registros_T1.jsonl`: cada registro se copia en el momento en que se guarda.
- `registros_T1.xlsx` y `registros_T1.csv`: listos para abrir; se regeneran cada 10 registros o cada 30 s y nunca quedan a medias.

Si la USB se retira, el tótem sigue funcionando y muestra un punto rojo pequeño en la esquina inferior derecha de la pantalla de inicio; al reconectarla se pone al día sola. Si el tótem se daña, basta con sacar la USB. Solo se escribe en una unidad con esa carpeta, nunca en el disco del sistema.

En desarrollo, `TOTEM_RESPALDO_RAICES=ruta1;ruta2` sustituye las unidades donde se busca la carpeta (para pruebas).

## Textos, tiempos y QR (`content.json`)

- Se lee en este orden; el primero válido gana:
  1. `%APPDATA%\Totem Talento\content.json`
  2. El que trae el instalador (`resources\content.json` junto al .exe).
  3. Los valores por defecto del código.
- Para cambiar algo el día del evento (URLs de los QR, frases, tiempos), copia el `content.json` del instalador a `%APPDATA%\Totem Talento\`, edítalo y reinicia la app. No hace falta reinstalar.
- Si el archivo tiene un error, se ignora y el log dice por qué.
- QR: uno por talento (`talentos.A`, `talentos.I`, `talentos.V`), porque cada talento lleva siempre al mismo juego (Reflejo → simulador).
  - Con `qrUrl` (http/https), el QR se genera en el tótem sin internet.
  - Con `qrImage` (un PNG o JPG junto al `content.json`), se usa esa imagen.
  - Sin ninguno, el boleto dice "QR pendiente" y el panel lo avisa.

## Publicación en Vercel

El repo está conectado a dos proyectos de Vercel; **cada push a `main` publica los dos**:

| Proyecto | URL | Root Directory | Build |
|---|---|---|---|
| `totem-talento` (página del QR) | <https://totem-talento.vercel.app> | `web` | ninguno (archivos estáticos) |
| `totem-talento-demo` (demo para el cliente) | <https://totem-talento-demo.vercel.app> | `demo` | install `cd .. && ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci`, build `cd .. && npm run build:demo`, output `dist` |

La configuración vive en *Project Settings → Build and Deployment* de cada proyecto. Sin el Root Directory, Vercel compila la app de Electron desde la raíz y falla con "No Output Directory named dist".

## Demo web para revisión (`demo/`)

La app del tótem completa en el navegador, para que el cliente la valide: <https://totem-talento-demo.vercel.app>. Mismo código y mismas pantallas; los registros se guardan en el navegador de quien revisa y "Exportar a USB" descarga el Excel y el CSV reales. Detalles en [demo/README.md](demo/README.md).

## Página del QR (`web/`)

Cada QR del boleto abre la página de su talento, con la imagen de su reto y dos botones: **Compartir en mi historia** (menú de compartir del celular → Instagram → Historia; ninguna web puede publicar directo en Instagram) y **Guardar imagen** (descarga en Android; en iPhone abre el menú con "Guardar imagen", porque una descarga ahí va a "Archivos").

- URLs de prueba (cuenta Hobby de Vercel, solo para pruebas; antes del evento decidir dónde queda la definitiva):
  - <https://totem-talento.vercel.app/acelerador>
  - <https://totem-talento.vercel.app/impulsor>
  - <https://totem-talento.vercel.app/reflejo>
- HTML/CSS/JS estático, sin frameworks ni recursos de terceros. Fuentes locales.
- Misma identidad que las pantallas del tótem: azul CONAIP plano, Poppins y botones Yellow X. Las páginas de talento solo muestran "{Talento}, tu reto es:", el boleto, los botones y el Instagram de CONAIP, con la trama pixeleada de Eliot en la orilla derecha, y en el celular caben en una pantalla sin scroll (el boleto toma el alto que sobra); la de inicio lleva además la banda de logos que se deshace en píxeles. Medidas del artboard de 1080 px a escala de celular; en pantallas anchas, dos columnas.
- Estructura: en la raíz solo las páginas (sus nombres son las URLs de los QR: `index.html`, `acelerador.html`, `impulsor.html`, `reflejo.html`); todo lo demás en `assets/`:
  - `css/estilos.css`, `js/compartir.js` y `fonts/` (Poppins 400, 700 y 900).
  - `img/logos/`: CONAIP y Eliot.
  - `img/retos/{talento}.jpg`: 1080×1920 (tamaño de historia), con fondo azul CONAIP en lugar del marco blanco; es el archivo que se guarda o comparte. `{talento}.webp`: el boleto sin el marco blanco (transparente por fuera, recortado a 1032×1859) para mostrarlo sobre el azul de la página. `{talento}-mini.webp`: lo mismo a 270×486, para la página de inicio. Salen de `assets/tickets/tipoJuego/`.
  - `img/pixeles/`: la orilla de la banda de logos y la trama de Eliot (SVG).
- Las tres páginas son iguales salvo el talento; si se cambia una, cambiar las tres.
- Si cambian las URLs, actualizar `talentos.{A,I,V}.qrUrl` en `content.json` (no hace falta reinstalar, ver arriba).
- No se publica dentro de la app del tótem (`electron-builder.yml` excluye `web/`).

## Despliegue en el tótem (Windows 11)

1. Instalar `dist/totem-talento-<versión>-setup.exe` y abrir la app una vez.
2. Configurar Windows (AGENTS.md §19):
   - Pausar Windows Update.
   - Desactivar notificaciones (Asistente de concentración).
   - Suspensión y apagado de pantalla en "Nunca".
   - Desactivar los gestos de borde: `HKLM\SOFTWARE\Policies\Microsoft\Windows\EdgeUI\AllowEdgeSwipe = 0` (DWORD).
   - Desactivar la aparición automática del teclado táctil.
   - Inicio de sesión automático.
   - Escalado de pantalla al 100 % y barra de tareas oculta.
   - **Fecha, hora y zona horaria correctas** (sin internet no se sincronizan solas).
3. En el panel admin:
   - Elegir **T1** en un tótem y **T2** en el otro (hasta entonces el panel avisa "ID sin confirmar").
   - Cambiar el PIN de fábrica.
   - Conectar la USB de respaldo y tocar "Preparar USB"; el punto rojo de la pantalla de inicio debe desaparecer.
   - Revisar la fecha y hora que muestra el panel.
   - Revisar que no haya avisos de QR pendiente.
4. Un no-break por tótem.

### Prueba en el tótem (AGENTS.md §17)

- [ ] Con el cable de red desconectado (y sin Wi-Fi), el flujo completo funciona igual.
- [ ] Alt+Tab, Alt+F4, tecla Windows, gestos de borde y toques múltiples no sacan de la app.
- [ ] Un correo o teléfono repetido se bloquea con su mensaje.
- [ ] Tras dejar el registro o el quiz sin tocar, aparece "¿Sigues ahí?" y luego vuelve al inicio sin datos.
- [ ] El boleto se ve bien con un nombre de 2 letras y uno de 30.
- [ ] Los QR se escanean a la primera con iPhone y Android a 30–50 cm.
- [ ] "Exportar a USB": el diálogo aparece encima de la app y escribe el `.xlsx` y el `.csv` en la USB.
- [ ] El `.xlsx` y el `.csv` abren en Excel con acentos y ñ correctos.
- [ ] Al reiniciar Windows, la app arranca sola.
- [ ] Al matar la app desde el Administrador de tareas a medio uso, los registros siguen completos al reabrir.
- [ ] Al retirar la USB de respaldo aparece el punto rojo; al reconectarla, el panel muestra "N de N registros copiados" y el `.xlsx` de la USB abre con todos.
