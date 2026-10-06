# Bitácora de cambios — Totem Talento

Registro de cada cambio en el proyecto, del más antiguo al más reciente. Cada entrada indica la fase del plan ([CLAUDE.md §16](CLAUDE.md)), qué se hizo, qué archivos se tocaron, cómo se verificó y qué decisiones se tomaron.

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

---

## 2026-10-05 — Bitácora y primer historial de commits

**Fase:** 0 — Base

- Se crea este archivo (`BITACORAS.md`) para llevar el historial de cambios.
- El trabajo de la Fase 0 se divide en 19 commits temáticos (sin coautoría de asistentes, según la nota del CLAUDE.md).

---

## 2026-10-05 — Formulario de registro, validaciones y teclado en pantalla

**Fase:** 2 — Registro y quiz (incluye `validation.ts`, que el plan ubica en la Fase 1)

### Validaciones (`src/shared/validation.ts`)
- Funciones puras: el renderer las usa al capturar y el proceso principal debe repetirlas al guardar.
- **Nombre(s) y Apellido:** obligatorios, de 2 a 60 caracteres y con al menos 2 letras. Solo letras (con acentos y ñ), espacios, apóstrofe (`'` o `’`) y guion.
- **Correo:** obligatorio, máximo 80 caracteres, normalizado (trim + minúsculas). Sin puntos al inicio, al final ni seguidos, y con una terminación de dominio de 2 letras o más.
- **Teléfono:** exactamente 10 dígitos. El error dice cuántos faltan ("te faltan 4").
- **Aviso de privacidad:** aceptación obligatoria.
- API: `limpiar*` (filtra mientras se escribe), `normalizar*` (al guardar), `validar*` por campo, `validarRegistro`, `esRegistroValido` y `normalizarRegistro`.

### Pantalla de registro (`screens/Registro.tsx`)
- Campos: Nombre(s), Apellido, Correo electrónico y Teléfono (10 dígitos). Usan `inputMode="none"` y no tienen autocompletar ni autocorrector.
- Cada error aparece debajo de su campo, con altura reservada para que la pantalla no salte.
- Los errores aparecen al dejar un campo con algo escrito o al tocar "Continuar", nunca antes de empezar a escribir.
- "Continuar" se ve deshabilitado (`aria-disabled`) mientras falte algo. Al tocarlo no avanza y muestra qué falta.
- Botón "Ver aviso de privacidad" y casilla "He leído y acepto el aviso de privacidad".
- Al volver del quiz con "Atrás" se recuperan los datos capturados.
- Al enviar se normalizan nombre, apellido y correo.
- Para que quepan los 4 campos en 1920 px, el subtítulo se acortó a una línea ("Completa tus datos para comenzar.") y se quitó el margen extra del título.

### Modal (`components/Modal.tsx`)
- Modal reutilizable (servirá también para "¿Sigues ahí?"). Solo se cierra con su botón y el cuerpo tiene scroll.
- El aviso de privacidad muestra "Texto pendiente." mientras llega el texto (`TEXTO_PRIVACIDAD` en `Registro.tsx`; después vendrá de `content.json`).

### Teclado en pantalla (`components/Teclado.tsx`, `components/teclas.ts`)
- Se abre al tocar un campo o su etiqueta. "Listo" o tocar fuera lo oculta.
- "Siguiente" avanza Nombre(s) → Apellido → Correo → Teléfono.
- Diseños:
  - **Alfabético** (Nombre(s) y Apellido): QWERTY con ñ, fila de acentos (á é í ó ú ü), apóstrofe, guion, ⇧, borrar, espacio y "Siguiente".
  - **Correo:** números, letras, `_`, `-`, `@`, `.` y los atajos `@gmail.com`, `@hotmail.com`, `@outlook.com` y `.com`. Un atajo de dominio sustituye lo escrito después de la @ ("ana@gm" + `@gmail.com` → "ana@gmail.com").
  - **Numérico:** 3×4 con borrar y "Listo".
- Mayúscula automática al inicio de cada palabra y después de un guion. ⇧ invierte solo la siguiente letra.
- Escribe al apoyar el dedo (`pointerdown`). Al tocarla, la tecla se encoge y se pone dorada. Mantener presionado borrar repite (a los 450 ms y luego cada 70 ms).
- El teclado no le quita el foco al campo (`preventDefault` en `pointerdown` y `mousedown`) y el foco sigue al campo activo.
- El cursor queda siempre al final y, con textos largos, el campo se desplaza para mostrar lo último escrito.
- Las teclas miden al menos 92 px en el artboard (el mínimo pedido es 80).
- El teclado físico sigue funcionando (útil en desarrollo).

### Datos
- Se agregó `apellido` a `Registro` (`shared/types.ts`) y a `DatosRegistro` (`state/flow.ts`).
- El boleto no cambia: sigue tomando el primer nombre de Nombre(s).

### Estilos
- `tokens.css`: nuevo color `--error: #ffb4b4`, legible sobre el azul.
- `global.css`: clases `.campo*`, `.casilla*`, `.modal*`, `.teclado*`, `.tecla*` y `.boton[aria-disabled='true']`.

**Archivos:**
- Nuevos: `src/shared/validation.ts`, `src/shared/validation.test.ts`, `src/renderer/components/Modal.tsx`, `src/renderer/components/Teclado.tsx`, `src/renderer/components/teclas.ts` y `src/renderer/components/teclas.test.ts`.
- Modificados: `src/shared/types.ts`, `src/renderer/state/flow.ts`, `src/renderer/screens/Registro.tsx`, `src/renderer/styles/global.css` y `src/renderer/styles/tokens.css`.

### Pruebas
- `validation.test.ts`: casos válidos e inválidos de cada campo, limpieza al escribir, normalización y registro completo.
- `teclas.test.ts`: contenido de los tres diseños, atajos de dominio, borrar y mayúscula automática.
- Resultado: 93 pruebas pasan (antes 19); typecheck y lint limpios.

### Verificación manual (app real con Playwright)
- Script con toques táctiles reales (CDP `Input.dispatchTouchEvent`) y con mouse: 45 comprobaciones correctas y sin errores de consola. Cubre:
  - Apertura y cierre del teclado, diseño correcto por campo y orden de "Siguiente".
  - Mayúscula automática, ⇧, acentos, guion, borrar y mantener borrar.
  - Atajos de correo, límite de 10 dígitos y foco conservado tras cada tecla.
  - Errores al dejar un campo y al corregirlo, flujo hasta el quiz y regreso con los 4 datos intactos.
- Medidas en el artboard:
  - Los botones terminan en y=1848, dentro del margen.
  - El teclado nunca tapa el campo activo ni su error (alfabético desde y=1316, correo desde y=1204, numérico desde y=1428).
- Con un correo de 58 caracteres, el campo muestra el final.
- Se ejecutó con un `--user-data-dir` aparte porque `electron-vite dev` estaba abierto (bloqueo de instancia única). Playwright se corrió desde una carpeta temporal; no se agregó al proyecto.

### Decisiones
- "Continuar" usa `aria-disabled` en lugar de `disabled`: en un tótem, un botón que no responde confunde.
- Además del botón del aviso se agregó la casilla de aceptación, que el §10 pide como obligatoria.
- Un solo campo de Apellido (ahí van los dos apellidos), obligatorio, con las mismas reglas y el mismo máximo de 60 caracteres que Nombre(s).
- Los caracteres inválidos se descartan al escribir, pero la validación los revisa de nuevo para cuando la use el proceso principal.
- El correo no admite ñ ni acentos, y el teclado de correo no los incluye.
- Los errores se marcan al cambiar de campo o al ocultar el teclado, y no en `blur`, porque tocar el teclado puede mover el foco.
- El estado "presionada" de la tecla es propio, porque `:active` no es confiable en táctil con `preventDefault`.
- El teclado solo agrega o borra al final, así que el cursor se mantiene al final.

### Pendientes detectados
- Bloqueo de correos duplicados (`registro:existeEmail`): requiere el storage y el IPC de la Fase 1.
- Texto del aviso de privacidad: pendiente del cliente; después vendrá de `content.json`.
- El AGENTS.md (§9 y §10) aún describe solo `nombre`. La exportación de la Fase 4 debe incluir la columna Apellido.
- Aún no existe el temporizador de inactividad (Fase 1). Por ahora, el estado del formulario es local y se borra al salir de la pantalla.
