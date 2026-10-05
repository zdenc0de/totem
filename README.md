# Totem Talento

App de kiosco para el Quiz de Talento CONAIP × Eliot Awards. La especificación completa está en [CLAUDE.md](CLAUDE.md).

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
- Panel de administrador: 5 toques en la esquina superior izquierda en menos de 3 s, desde la pantalla de inicio.
- Si Electron arranca como Node (`Cannot read properties of undefined (reading 'isPackaged')`), la terminal tiene `ELECTRON_RUN_AS_NODE=1` (pasa en algunas terminales integradas). Quítala antes de correr la app.

## Build para Windows

```bash
npm run build:win    # instalador NSIS x64 en dist/
```

## Datos y logs

- Logs: `%APPDATA%\Totem Talento\logs\` (nunca contienen datos personales).
