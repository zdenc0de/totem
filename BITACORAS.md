# Bitácora de cambios — Totem Talento

Registro de cada cambio en el proyecto, del más reciente al más antiguo. Cada entrada indica la fase del plan ([CLAUDE.md §16](CLAUDE.md)), qué se hizo, qué archivos se tocaron, cómo se verificó y qué decisiones se tomaron.

---

## 2026-10-05 — Bitácora y primer historial de commits

**Fase:** 0 — Base

- Se crea este archivo (`VITACORAS.md`) para llevar el historial de cambios.
- El trabajo de la Fase 0 se divide en 19 commits temáticos (sin coautoría de asistentes, según la nota del CLAUDE.md).

---

## 2026-10-05 — Fase 0: base del proyecto

**Fase:** 0 — Base (fecha planeada: 5 oct)

### Proyecto y herramientas
- Proyecto creado con la plantilla `@quick-start/electron` (React + TypeScript) y reorganizado según la estructura del §15:
  `src/main`, `src/preload`, `src/shared`, `src/renderer/{screens,components,state,styles,assets}`.
- Versiones: Electron 44.5.1, electron-vite 5, Vite 7, React 18.3, TypeScript 5.9, Framer Motion 14, Vitest 5, electron-builder 26.
- Alias `@shared` (main, preload, renderer y Vitest) y `@renderer`.
- `electron-builder.yml`: solo Windows x64 con NSIS; se quitaron mac/linux y la sección `publish` (auto-update).
- **Archivos:** `package.json`, `package-lock.json`, `electron.vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `eslint.config.mjs`, `.editorconfig`, `.prettierrc.yaml`, `.prettierignore`, `.gitignore`, `.vscode/`, `electron-builder.yml`, `build/`, `resources/`.

### Proceso principal (`src/main/`)
- `net-policy.ts`: política de red pura. En producción solo permite `file:`, `app:`, `data:` y `blob:`; en desarrollo agrega el servidor de Vite (HTTP + WebSocket de HMR) y DevTools.
- `hardening.ts`:
  - Sesión: bloqueo de requests con `onBeforeRequest`, todos los permisos negados, corrector ortográfico apagado (descarga diccionarios de internet).
  - Contenido: bloqueo de `will-navigate`, `will-redirect` y webviews; `setWindowOpenHandler → deny`; sin pinch-zoom ni zoom.
  - Atajos: bloquea Ctrl/Alt/Win, teclas F y Escape. En desarrollo permite F12, Ctrl+R y Ctrl+Shift+Q.
  - Autorrecuperación: recarga si el renderer se cae (`render-process-gone`) o se congela más de 8 s.
- `log.ts`: log diario en `userData/logs/totem_YYYY-MM-DD.log`, sin datos personales.
- `index.ts`:
  - Ventana kiosco (`kiosk`, `fullscreen`, sin marco, siempre al frente) con `contextIsolation`, `sandbox` y sin `nodeIntegration`; DevTools solo en desarrollo.
  - Bloqueo del cierre (Alt+F4) salvo salida desde el panel admin.
  - `requestSingleInstanceLock`, `powerSaveBlocker`, menú eliminado y switches de Chromium sin red en segundo plano.
  - En desarrollo abre una ventana de 540×960; `TOTEM_KIOSK=1` fuerza el kiosco.

### Preload (`src/preload/`)
- Se quitó el `electronAPI` genérico de la plantilla. Solo se expone `window.totem.admin.salir()` vía `contextBridge`.
- Canales IPC centralizados en `src/shared/ipc.ts`.

### Compartido (`src/shared/`)
- `types.ts`: `Talento`, `Juego`, `TotemId` y `Registro` (§9).
- `quiz.ts`: las 5 preguntas con sus opciones A / I / V (§5).

### Renderer (`src/renderer/`)
- `index.html` con la CSP exacta del §13.
- `styles/tokens.css` (colores, fuente, medidas) y `styles/global.css` (sin selección, sin arrastre, `touch-action: manipulation`, botones con feedback al tocar).
- Poppins local (`@fontsource/poppins`, subconjunto latin: acentos, ñ, ¿ y ¡).
- `components/Stage.tsx`: artboard fijo de 1080×1920 escalado con `transform` y letterbox.
- `components/HotCorner.tsx`: 5 toques en menos de 3 s en la esquina superior izquierda (solo en IDLE) abren el panel admin.
- `components/DevNav.tsx`: barra para saltar entre pantallas, solo en desarrollo.
- `state/flow.ts`: máquina de estados con `useReducer` (INICIAR, ENVIAR_REGISTRO, RESPONDER, ATRAS, CALCULO_TERMINADO, REINICIAR, ABRIR/CERRAR_ADMIN). Volver a IDLE restablece todo el estado.
- Pantallas provisionales: `Idle`, `Registro`, `Quiz`, `Calculando` (1.5 s), `Boleto` y `Admin`, con transición de fundido.

### Pruebas
- `src/main/net-policy.test.ts`: URLs permitidas y bloqueadas en producción y en desarrollo.
- `src/no-network.test.ts`: revisión estática. Verifica la CSP exacta, que no haya URLs remotas en el código fuente y que no exista configuración de auto-update.
- Resultado: 19 pruebas pasan; typecheck y lint limpios.

### Verificación manual (app real con Playwright)
- Flujo completo IDLE → Registro → Quiz (5 preguntas, con "Atrás") → Calculando → Boleto → IDLE.
- Letterbox correcto en ventana vertical, horizontal y pantalla completa.
- Red: `fetch`, imagen remota y `net.fetch` desde main quedan bloqueados (`ERR_BLOCKED_BY_CLIENT`).
- Renderer sin `require` ni `process`; solo `window.totem`.
- Kiosco: `close()` y Alt+F4 bloqueados; kiosk + fullscreen + always-on-top; salida solo desde admin.
- `npm run dev`: renderiza sin errores de consola y el HMR funciona con la CSP.

### Decisiones
- React 18 (lo pide el CLAUDE.md), aunque la plantilla traía la 19.
- Vite 7 porque electron-vite 5 no soporta Vite 8; TypeScript 5.9 porque la 7 aún rompe tooling.
- Las librerías del renderer van en `devDependencies` porque Vite las empaqueta y no inflan el instalador.

### Pendientes detectados
- El panel admin aún no pide PIN (Fase 4).
- Arranque automático con Windows (`openAtLogin`): Fase 4.
- Si la terminal tiene `ELECTRON_RUN_AS_NODE=1` (pasa en el host de extensiones de VS Code), Electron arranca como Node y falla. Está documentado en el README.
