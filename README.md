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

## Textos, tiempos y QR (`content.json`)

- Se lee en este orden; el primero válido gana:
  1. `%APPDATA%\Totem Talento\content.json`
  2. El que trae el instalador (`resources\content.json` junto al .exe).
  3. Los valores por defecto del código.
- Para cambiar algo el día del evento (URLs de los QR, frases, tiempos), copia el `content.json` del instalador a `%APPDATA%\Totem Talento\`, edítalo y reinicia la app. No hace falta reinstalar.
- Si el archivo tiene un error, se ignora y el log dice por qué.
- QR:
  - Con `qrUrl` (http/https), el QR se genera en el tótem sin internet.
  - Con `qrImage` (un PNG o JPG junto al `content.json`), se usa esa imagen.
  - Sin ninguno, el boleto dice "QR pendiente" y el panel lo avisa.

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
3. En el panel admin:
   - Elegir **T1** en un tótem y **T2** en el otro (hasta entonces el panel avisa "ID sin confirmar").
   - Cambiar el PIN de fábrica.
   - Revisar que no haya avisos de QR pendiente.

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
