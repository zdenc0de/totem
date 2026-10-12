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

## 2026-10-11 — Fase 1: resultado, datos, IPC, duplicados e inactividad

**Fase:** 1 — Lógica (fecha planeada: 6–7 oct)

### Preparación
- Se commitearon el aviso de privacidad y las notas de commits del AGENTS.md.
- AGENTS.md se actualizó con las decisiones de la planeación: apellido, duplicados por teléfono, `userData/content.json`, inactividad por pantalla, nombre en el boleto, PIN `1234`, exportación con un botón y aviso de ID sin confirmar.
- Se quitó la entrada duplicada "El resto del quiz regresa a los colores de CONAIP".
- `state/dev.ts` no se había commiteado: se rehízo (`TOTEM_PANTALLA` / `TOTEM_NOMBRE`), y ahora DevNav también salta con datos de ejemplo.
- Dependencias nuevas (devDependencies, empaquetadas por electron-vite): `zod`, `qrcode`, `exceljs` y `esbuild` (lo usa una prueba).

### Compartido (`src/shared/`)
- `result.ts`: `calcularResultado(respuestas, reglas)` (§6). Las reglas vienen de config. `esRespuestas` valida 5 respuestas A/I/V.
- `content.ts`: esquema zod de `content.json`, `CONTENIDO_POR_DEFECTO` y `ConfigRenderer` (lo que recibe el renderer: sin el PIN y con los QR ya generados). El renderer solo importa tipos, así que zod no entra a su bundle.
- `fecha.ts`: `isoLocal` (ISO con desfase local) y `selloArchivo` (`YYYY-MM-DD_HHmm`).
- `nombre.ts`: `primerNombre` ("zDENKO" → "Zdenko", "ana-sofía" → "Ana-Sofía").
- `quiz.ts`: `barajarOpciones` (Fisher–Yates, una vez por participante).
- `validation.ts`: mensajes de correo y teléfono repetidos.
- `ipc.ts`: canales y tipos de las respuestas.

### Config (`resources/content.json`)
- Generado desde `CONTENIDO_POR_DEFECTO`: nombres de AGENTS.md, frases del mockup como placeholder, aviso de CONAIP y PIN `1234`.
- `electron-builder.yml`: `extraResources` lo copia junto al ejecutable.
- Orden de lectura: `userData/content.json` → `resources/content.json` → valores por defecto. El que no es JSON o no pasa el esquema se salta y se registra en el log.

### Proceso principal (`src/main/`)
- `storage.ts`:
  - `registros.jsonl` y `backup/registros_backup.jsonl` con open → write → fsync → close.
  - Basta con que uno de los dos se escriba; si fallan ambos, un reintento.
  - Al arrancar une ambos archivos por `id`, omite líneas dañadas y, si el archivo quedó sin salto de línea final (proceso muerto a media escritura), se lo agrega para que el siguiente registro no quede pegado.
  - Sets de correos y teléfonos.
- `settings.json` (`settings.ts`): `totemId`, `idConfirmado` y `pinHash`. Se escribe con temporal + fsync + rename.
- `pin.ts`: hash scrypt con sal y comparación en tiempo constante. Sin hash, compara contra `adminPinDefault`.
- `config.ts`: carga del contenido y QR generados localmente con `qrcode` (nivel Q, zona blanca de 4 módulos). `qrImage` tiene prioridad sobre `qrUrl`; sin ninguno válido, el QR queda pendiente.
- `registro.ts`: arma el `Registro`. Main vuelve a validar y normalizar los datos y recalcula el resultado; ignora talento y juego que mande el renderer.
- `ipc.ts`:
  - `config:get`, `registro:existeDuplicado` y `registro:guardar` (revisa duplicados otra vez antes de escribir).
  - `admin:*`: solo responden después de `admin:verificarPin`. Tras 5 PIN incorrectos seguidos, 30 s de espera. El panel se vuelve a bloquear al salir de él o al recargar la página.
- `index.ts`: carga config, storage, settings e IPC antes de abrir la ventana. Si algo falla al iniciar, la ventana abre igual y muestra "Fuera de servicio".
- En el log, las rutas van recortadas a carpeta/archivo (la de userData incluye el usuario de Windows).

### Renderer
- `App.tsx`: pide la config una vez y la comparte con `ContenidoContext`.
- `state/flow.ts`: `INICIAR` recibe el orden barajado; `CALCULO_TERMINADO` recibe el resultado.
- `state/useInactividad.ts`:
  - REGISTRO y QUIZ: modal "¿Sigues ahí?" con cuenta regresiva y luego IDLE.
  - ADMIN: se cierra directo.
  - BOLETO e IDLE no se vigilan.
- `Modal.tsx`: texto del botón configurable y capa por encima del teclado.
- `Registro.tsx`: el aviso viene de la config. Al tocar "Continuar" se pregunta a main por duplicados y el error aparece debajo del campo; se quita solo al cambiar el dato.
- `Calculando.tsx`: guarda el registro y espera lo que tarde más entre el guardado y 1.5 s. Si main no responde, calcula el resultado localmente y muestra el boleto igual.
- `Admin.tsx`: al desmontarse le pide a main que bloquee el panel.

**Archivos:**
- Nuevos:
  - `src/shared/{result,content,fecha,nombre}.ts` (+ pruebas) y `resources/content.json`.
  - `src/main/{storage,settings,pin,config,registro,ipc}.ts`, `storage.fixture.ts` y las pruebas de main.
  - `src/renderer/state/{contenido,dev,useInactividad}.ts` y `flow.test.ts`.
- Modificados:
  - `src/main/index.ts`, `src/preload/index.ts`, `src/shared/{ipc,quiz,validation}.ts` y `electron-builder.yml`.
  - `src/renderer/App.tsx`, `components/{DevNav,Modal}.tsx`, `screens/{Idle,Registro,Calculando,Boleto,Admin}.tsx`, `state/flow.ts` y `styles/global.css`.

### Pruebas
- `result.test.ts`: los 9 casos obligatorios y las 243 combinaciones (81 simulador / 162 pera; A 51, I 51, V 141); también reglas distintas desde config.
- `storage.test.ts`:
  - Principal + backup, Sets al reabrir, línea truncada, registro que solo está en el backup y 300 registros seguidos.
  - Un proceso hijo con el `storage.ts` real que se mata con SIGKILL a media escritura: todo lo recuperado está completo y en orden.
- `config`, `pin`, `registro`, `content`, `fecha`, `nombre` y `flow` (REINICIAR, CERRAR_ADMIN y abandono no dejan datos; "Atrás"; toques fuera de pantalla).
- Resultado: 161 pruebas pasan; typecheck y lint limpios.

### Verificación manual (build real, manejado por CDP)
- Flujo completo hasta el boleto, con el registro en ambos archivos.
- Correo y teléfono repetidos bloqueados con sus mensajes.
- "¿Sigues ahí?" y regreso a IDLE con los campos vacíos.
- `admin.salir` y `admin.estado` rechazados sin PIN; la config no trae el PIN; QR generado.
- Sin errores de consola.
- Se usó un `userData/content.json` con tiempos cortos, que de paso prueba la prioridad de lectura.

### Pendientes detectados
- El nombre se guarda como se escribió ("zDENKO maría"); el boleto usará `primerNombre` (Fase 3).
- El regreso automático del boleto llega en la Fase 3; el panel admin con PIN, en la Fase 4.

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

---

## 2026-10-11 — Texto del aviso de privacidad

**Fase:** 2 — Registro y quiz

- El cliente entregó el aviso de privacidad de CONAIP. Se adaptó para leerse en el tótem sin cambiar su contenido legal:
  - Se dividió en 13 secciones con título (Responsable, Finalidad, Datos que podemos solicitar, Derechos, etc.).
  - Las enumeraciones largas pasaron a listas (finalidades, datos que se piden, derechos, pasos para ejercerlos).
  - Se corrigieron erratas ("didferentes", "fisicos", "El presente Política", "Articulo", un "286" suelto, "recogidaNuestra").
  - Se quitó el encabezado "Última actualización", que venía sin fecha.
- `shared/privacidad.ts` (nuevo): `TEXTO_PRIVACIDAD`, `PRIVACY_VERSION = 'v1'` y `bloquesAviso`, que convierte el texto en títulos (`## `), listas (`- `) y párrafos. Así, cuando exista `content.json`, `privacidad.texto` seguirá siendo un solo string con el mismo formato.
- `Registro.tsx`: el modal muestra el aviso con ese formato. `global.css`: estilos `.aviso` (títulos en azul, viñetas en rojo).

**Archivos:**
- Nuevos: `src/shared/privacidad.ts` y `src/shared/privacidad.test.ts`.
- Modificados: `src/renderer/screens/Registro.tsx` y `src/renderer/styles/global.css`.

### Verificación
- 96 pruebas pasan (3 nuevas del parser y del texto); typecheck, lint y prettier limpios.
- Capturas del build: el modal muestra los títulos y las listas, y hace scroll.

### Pendientes detectados
- Con el cliente: el texto habla de una aplicación móvil, CURP, fotografías y cámara, que el tótem no usa. También pide descargar un formato en PDF que no está enlazado. Falta la fecha de "Última actualización".

---

## 2026-10-11 — Quiz con opciones barajadas

**Fase:** 2 — Registro y quiz

- `screens/Quiz.tsx`:
  - Usa el orden barajado al iniciar (`state.ordenOpciones`), así que "Atrás" muestra el mismo orden.
  - La opción ya elegida queda marcada en dorado.
  - La barra de progreso avanza con `scaleX` y cada pregunta entra con una transición corta (solo `transform` y `opacity`).
- **Toques erráticos:** al elegir, la opción se resalta 220 ms y después se responde. Un `ref` bloquea al instante los demás toques. Con solo el estado no bastaba: dos toques en la misma tarea contestaban dos preguntas, porque React aún no había vuelto a renderizar.
- `global.css`: clases `.quiz*` en lugar de estilos en línea.

**Archivos:** `src/renderer/screens/Quiz.tsx` y `src/renderer/styles/global.css`.

### Verificación
- 161 pruebas pasan (`barajarOpciones` ya estaba probada en la Fase 1); typecheck y lint limpios.
- En el build real, manejado por CDP:
  - Un doble toque avanza una sola pregunta.
  - "Atrás" regresa con el mismo orden y la opción marcada.
  - Cambiar la respuesta de la pregunta 2 se refleja en lo guardado, y las respuestas guardadas coinciden con las elegidas.
  - Los órdenes salieron barajados (`VIA AIV VIA AIV AVI`).
  - Sin errores de consola.

---

## 2026-10-08 — Paleta de Eliot y rediseño de IDLE

**Fase:** 3 — Interfaz final (adelanto: IDLE e identidad de color)

### Paleta (`styles/tokens.css`)
- Se reemplazan por completo los colores anteriores (rojo, azul y dorado) por los del manual de identidad de Eliot (`assets/inspiration/Elliot_identidad_colores.jpeg`):
  - Primarios: Yellow X `#FFED00` y negro `#000000`.
  - Secundarios: blanco, Yellow 1–3 y Black 80 / 40.
  - Terciarios: Yellow 4–6 y Black 60 / 20 / 10.
- Tokens de uso: `--fondo` (Yellow X), `--tinta` (negro), `--texto-suave` (Black 80) y `--texto-suave-negro` (Black 20, para texto sobre negro).
- Se elimina `--error`. Como la paleta no tiene rojo, el error se muestra como una etiqueta negra con texto amarillo y el campo con error lleva borde punteado (el activo, sólido).

### IDLE (`screens/Idle.tsx`, `components/Mosaico.tsx`)
- Fondo Yellow X. El titular "Descubre tu tipo de talento" va en Poppins 900 de 150 px, alineado a la izquierda. Debajo, una línea que explica qué pasa ("Responde 5 preguntas y te diremos qué juego te toca.") y un bloque negro con "Toca para comenzar" (toda la pantalla sigue siendo el botón).
- **Mosaico:** trama de cuadros negros con la forma de rombo redondeado del sello "Más cerca de ti". Los cuadros se encogen hacia la orilla y se deshacen en píxeles sueltos de la paleta (negros, grises y amarillos) hacia arriba a la derecha, como los mosaicos del manual.
  - Se calcula una vez con semilla fija, así la composición es siempre la misma.
  - Entrada: los cuadros aparecen del centro hacia afuera cada vez que se vuelve a IDLE.
  - Después, una onda que sale del centro encoge y regresa los cuadros (escala de 1 a 0.5 en 4 s).
  - Solo CSS con `transform` y `opacity` (§14). Unos 180 elementos y sin JS por cuadro. Respeta `prefers-reduced-motion`.
- Es la única animación de la pantalla: el botón ya no pulsa.

### Resto de pantallas (solo color, sin rediseño)
- Botón principal negro con texto amarillo; secundario con borde negro; opciones del quiz en blanco.
- Teclado: panel negro, teclas blancas, teclas especiales en Black 80 y "Siguiente"/"Listo", ⇧ activa y la tecla presionada en Yellow X.
- Casilla: marcada en negro con palomita amarilla.
- Quiz y Calculando: pista en Yellow 1 y avance en negro.
- Boleto provisional: tarjeta negra con texto blanco.
- Admin: fondo negro, texto blanco y "Salir de la app" en amarillo.

**Archivos:**
- Nuevos: `src/renderer/components/Mosaico.tsx`.
- Modificados: `src/renderer/styles/tokens.css`, `src/renderer/styles/global.css`, `src/renderer/screens/{Idle,Quiz,Calculando,Boleto,Admin}.tsx`, `src/renderer/components/{Stage,DevNav}.tsx` y `src/renderer/main.tsx` (Poppins 900).

### Verificación
- 93 pruebas pasan; typecheck y lint limpios.
- Capturas del build en Chromium a 1080×1920 (puppeteer-core desde una carpeta temporal, no se agregó al proyecto):
  - IDLE a los 0.3 s (entrada) y a los 4 s (onda).
  - Registro con teclado abierto y con errores.
  - Quiz, Calculando, Boleto y Admin (abierto con los 5 toques en la esquina).
- Sin errores de consola (solo el 404 de `favicon.ico` del servidor temporal).

### Decisiones
- Se usa el hex `#FFED00` del manual para Yellow X, aunque su RGB (241, 237, 0) da `#F1ED00`.
- Para Black 10% se usa el RGB (230, 231, 232 = `#E6E7E8`), porque el hex del manual (`#363738`) no le corresponde.
- Se mantiene Poppins (§14) hasta que llegue Century Gothic.

### Pendientes detectados
- Confirmar con el cliente el valor correcto de Yellow X.
- El AGENTS.md (§7 y §14) todavía describe la paleta CONAIP (rojo, azul, dorado) y el boleto azul con franjas rojas. Hay que actualizarlo o confirmar qué identidad manda en el boleto.
- Logos de CONAIP y Eliot en alta para reemplazar el texto "CONAIP × Eliot Awards" en IDLE.

---

## 2026-10-08 — IDLE con las dos identidades (CONAIP × Eliot)

**Fase:** 3 — Interfaz final (IDLE)

### Referencias
- `assets/inspiration/MANUAL DE IDENTIDAD.pdf` (CONAIP): rojo `#AC141C`, azul `#0C53A2`, isotipo (círculo cortado por una paloma), Century Gothic para el logotipo y Poppins para materiales audiovisuales.
- `assets/inspiration/Conaip_x_Elliot.jpeg`: boleto co-marca del cliente. Lleva franja blanca con los dos logos, fondo azul, cortes rojos en diagonal y acentos amarillos.

### Logos (`assets/logos/`)
- Los dos logos viven en `assets/logos/`. `Idle.tsx` los importa de ahí, así que hay una sola copia de cada uno y Vite los empaqueta como archivos locales.
- `conaip.svg`: vector extraído de la página "Logotipo" del manual (`pdftocairo -svg`). Incluye isotipo, nombre, leyenda "Colegio Nacional de Integración Profesional" y su línea roja; se omitió la línea "Instancia Evaluadora…", ilegible a ese tamaño y ausente en el boleto del cliente. Los colores se ajustaron a los hex del manual (el vector traía la conversión CMYK, `#2958B0`).
- `elliot_svg.svg`: logo de Eliot Awards en vector, entregado por el cliente (negro `#1D1D1B`). Sin scripts ni recursos externos.

### Paleta (`styles/tokens.css`)
- Regresan `--rojo` y `--azul` de CONAIP junto a la paleta de Eliot.

### IDLE (`screens/Idle.tsx`, `components/Mosaico.tsx`)
- Composición:
  - Fondo azul CONAIP con franja blanca de logos arriba, como la cabecera del boleto. La franja se deshace en píxeles hacia el azul.
  - Titular del propio cliente: "Descubre tu talento y acepta el reto", en Poppins 900 blanca.
  - Bajada que nombra los dos juegos: "5 preguntas deciden tu reto: simulador de carreras o pera de box."
  - Botón de bloque amarillo con texto negro.
- El mosaico ahora es una escena completa en px del artboard, sobre una retícula de 44 px:
  - Rombo de trama amarilla (Eliot), que sigue latiendo en una onda desde el centro.
  - Paloma roja de píxeles al centro del rombo (guiño al isotipo de CONAIP y al "acierto" del quiz). No es el isotipo: el logo real va en la franja.
  - Dos franjas rojas en diagonal hechas de píxeles, como los cortes del boleto.
  - Píxeles sueltos en amarillos, blancos y negros; algunos parpadean (`steps`). El rojo se reserva para la paloma y las franjas, para que la paloma se lea.
- Entrada, cada vez que se vuelve a IDLE: el rombo se arma del centro hacia afuera (0–0.7 s), la paloma se dibuja de punta a punta (0.8–1.3 s) y las franjas suben (1.2–1.75 s). Después quedan la onda y los parpadeos.
- Sigue siendo solo CSS con `transform` y `opacity`, y respeta `prefers-reduced-motion`.

**Archivos:**
- Nuevos: `assets/logos/conaip.svg` (el de Eliot, `assets/logos/elliot_svg.svg`, lo agregó el cliente).
- Modificados: `src/renderer/components/Mosaico.tsx`, `src/renderer/screens/Idle.tsx`, `src/renderer/styles/global.css` y `src/renderer/styles/tokens.css`.

### Verificación
- 93 pruebas pasan; typecheck y lint limpios.
- Capturas del build en Chromium a 1080×1920: a los 0.4, 1, 1.5 y 6 s.
- Los logos se empaquetan como archivos locales (`out/renderer/assets/`), dentro de la CSP.

### Pendientes detectados
- El resto de las pantallas sigue en amarillo y negro; falta decidir si adoptan el mismo sistema que IDLE.
- El mockup del cliente usa otros nombres de talento: El Impulsor (fuerza, pera de box), El Acelerador (velocidad, simulador) y El Reflejo (reflejos, simulador). El AGENTS.md dice Acelerador, Impacto y Versátil. Hay que confirmar con el cliente antes de hacer el boleto.

---

## 2026-10-08 — El resto del quiz regresa a los colores de CONAIP

**Fase:** 3 — Interfaz final

- A petición del cliente, solo IDLE usa la combinación CONAIP × Eliot. Registro, teclado, modal, Quiz, Calculando, Boleto, Admin y DevNav regresan exactamente a como estaban (azul, rojo y dorado de CONAIP). Esto deshace el cambio de paleta de la entrada "Paleta de Eliot y rediseño de IDLE".
- `tokens.css`: vuelven los tokens originales (`--rojo`, `--azul`, `--azul-oscuro`, `--dorado`, `--texto-suave`, `--error`). De Eliot solo quedan los que usa IDLE: `--amarillo-x`, `--amarillo-2`, `--amarillo-4`, `--amarillo-6`, `--negro-80` y `--negro-20`.
- `global.css`: vuelve a la versión anterior, más la sección `/* IDLE */` (pantalla y mosaico).
- **Archivos restaurados desde git:** `components/{DevNav,Stage}.tsx`, `screens/{Quiz,Calculando,Boleto,Admin}.tsx`, `styles/global.css` (más la sección de IDLE) y `styles/tokens.css` (más los tokens de Eliot).
- **Verificación:** 93 pruebas pasan; typecheck y lint limpios. Se capturó el build con IDLE, Registro con teclado y error, Quiz, Boleto y Admin.
- **Pendientes:** se cierra el de "el resto de las pantallas sigue en amarillo y negro". El AGENTS.md (§14) vuelve a coincidir con la paleta del resto de las pantallas; solo IDLE agrega la de Eliot.

---

## 2026-10-08 — Abrir la app directo en una pantalla (solo desarrollo)

**Fase:** 3 — Interfaz final (herramienta para trabajar el boleto)

- `TOTEM_PANTALLA=boleto npm run dev` abre la app directo en esa pantalla, sin recorrer el flujo. Sirve para cualquier pantalla del flujo (`idle`, `registro`, `quiz`, `calculando`, `boleto`, `admin`).
- `main/index.ts`: en desarrollo pasa `TOTEM_PANTALLA` y `TOTEM_NOMBRE` como `?pantalla=…&nombre=…` en la URL del servidor de Vite. En producción no cambia nada.
- `renderer/state/dev.ts` (nuevo): `estadoInicialDev` arma el estado inicial con datos de ejemplo:
  - Registro: nombre "Zdenko" o el de `TOTEM_NOMBRE`.
  - Respuestas: `V V V A I`, que dan Versátil → simulador.
  - `App.tsx` solo lo usa si `import.meta.env.DEV`, así que no llega al build de producción.
- `Ctrl+R` recarga en la misma pantalla porque la URL conserva los parámetros. "Terminar" sigue regresando a IDLE.
- README: cómo usarlo y cómo abrir una segunda ventana si ya hay otra de desarrollo (`--user-data-dir`, por el bloqueo de instancia única).

**Archivos:**
- Nuevo: `src/renderer/state/dev.ts`.
- Modificados: `src/main/index.ts`, `src/renderer/App.tsx` y `README.md`.

### Verificación
- 93 pruebas pasan; typecheck y lint limpios.
- `http://localhost:5173/?pantalla=boleto` muestra el boleto con "Zdenko" y `V V V A I`.
- Se abrió una segunda ventana de Electron conectada al servidor de Vite que ya estaba corriendo.

### Notas
- Un segundo `electron-vite dev` falló con `EMFILE` (se agotó el límite de inotify del sistema). Por eso la segunda ventana se conectó al servidor existente: `ELECTRON_RENDERER_URL=http://localhost:5173 TOTEM_PANTALLA=boleto electron . --user-data-dir=…`, después de compilar.

---

## 2026-10-11 — Boleto final con QR, regreso automático y Calculando

**Fase:** 3 — Interfaz final

### Boleto (`components/Ticket.tsx`, `screens/Boleto.tsx`)
- Sigue el boleto del mockup del cliente (`assets/inspiration/Conaip_x_Elliot.jpeg`). Mide 936×1640 en el artboard.
- **Forma (SVG):**
  - Esquinas redondeadas, una muesca semicircular a cada lado y borde dorado que sigue las muescas.
  - Fondo azul en degradado con un brillo al centro, bandas claras y franjas rojas en diagonal recortadas a la forma.
  - Franja blanca de logos con una pestaña al centro.
- **Contenido (HTML encima):**
  - Logos de CONAIP y Eliot (`assets/logos/`).
  - "Zdenko," (`primerNombre`, siempre capitalizado), "TU TIPO DE TALENTO ES" con acento rojo-blanco-dorado.
  - Nombre del talento en Poppins 900 y la frase.
  - QR de 460 px en una tarjeta blanca con borde dorado, o "QR pendiente".
  - Banda "ESCANEA | para descubrir tu juego".
  - Con `showGameOnTicket`, una insignia con el nombre del juego.
- **Autoajuste (`components/useAjustarTexto.ts`):**
  - Baja el tamaño de letra hasta que el texto quepa: el nombre de 104 a 36 px; el talento de 112 a 56 px en 2 líneas.
  - Si ni en el mínimo cabe, el texto se parte en vez de cortarse.
  - Tolerancia de 1 px a lo ancho y de 0.3 em a lo alto: la tinta de Poppins (comas, acentos) sale un poco del renglón, y sin esa tolerancia todo terminaba en el tamaño mínimo.
- **Regreso automático:** a los `boletoSeg` segundos vuelve a IDLE. "Terminar (N)" muestra los segundos que faltan y su fondo se vacía con una animación CSS de `scaleX`.
- **Entrada:** el boleto aparece con un resorte (`y` + `scale`) y el QR un poco después.

### Calculando
- Tres barras (rojo, blanco y dorado) que suben y bajan en secuencia (`scaleY`) sobre un degradado azul.

### QR (`main/config.ts`)
- Margen de 2 módulos (la tarjeta blanca completa la zona blanca) y PNG de 920 px, el doble de su tamaño en pantalla.

**Archivos:**
- Nuevos: `src/renderer/components/Ticket.tsx` y `src/renderer/components/useAjustarTexto.ts`.
- Modificados: `src/renderer/screens/{Boleto,Calculando}.tsx`, `src/renderer/styles/global.css` y `src/main/config.ts`.

### Verificación
- 161 pruebas pasan; typecheck, lint y prettier limpios.
- Build real a 1080×1920 (emulación de CDP), con capturas de cada caso:

  | Nombre | Tamaño | Resultado |
  |---|---|---|
  | Zdenko | 104 px | Acelerador → QR |
  | Lu | 104 px | Impacto → QR pendiente |
  | Maximilianoalejandrogarcia (26) | 52 px | Versátil → QR |
  | Aaaa… (30 letras) | 38 px, una línea | Versátil → QR pendiente |

  - Ninguno desborda; el boleto y el botón quedan dentro del artboard y sin scroll.
  - El QR mide 460 px (≥ 380).
  - Regresa solo a IDLE con `boletoSeg` y sin errores de consola.

### Pendientes detectados
- Probar el escaneo con iPhone y Android a 30–50 cm en el tótem real (§17), con la URL definitiva.

---

## 2026-10-11 — Fase 4: panel admin, exportación, arranque automático e instalador

**Fase:** 4 — Admin y entrega (fecha planeada: 12–13 oct)

### Panel admin (`screens/Admin.tsx`)
- **Entrada:** 5 toques en la esquina → PIN con el teclado numérico propio (de 4 a 8 dígitos, mostrados como puntos). Un PIN incorrecto muestra "PIN incorrecto." En main, tras 5 errores seguidos hay 30 s de espera.
- **Panel:**
  - ID del tótem en la cabecera.
  - Avisos: "ID sin confirmar", PIN de fábrica y QR pendiente por juego.
  - Total de registros, conteo por talento y por juego.
  - Selector T1/T2 (marcado solo cuando ya se confirmó).
  - "Exportar a USB" con el resultado debajo y "Cambiar PIN" (escribirlo y confirmarlo).
  - "Volver al quiz" y "Salir de la app" (pide un segundo toque en menos de 3 s).
- **Inactividad:** el panel se cierra solo. Mientras está abierto el diálogo nativo de la USB (sus toques no llegan a la página), el panel avisa actividad con el evento `totem:actividad` para no cerrarse a media exportación.
- Al salir del panel (botón, inactividad o recarga), main lo vuelve a bloquear.

### Exportación (`main/export.ts`)
- `tablaExport`: todos los campos (incluido Apellido), Q1..Q5, conteos, talento y juego en código y con su nombre legible, ordenado por fecha. La columna Tótem sirve para detectar duplicados al unir T1 y T2.
- `aCsv`: BOM UTF-8, CRLF y comillas cuando hace falta. Antepone `'` a las celdas que empiezan con `= + - @` para que Excel no las tome como fórmula.
- `aXlsx` (exceljs): hoja "Registros" con encabezado en negritas y fijo, autofiltro y anchos de columna.
- `escribirExport`: escribe `registros_{T1}_{YYYY-MM-DD_HHmm}.xlsx` y `.csv` con fsync, para que la USB se pueda retirar en cuanto termina.
- IPC `admin:exportar`: abre el diálogo de carpeta como hijo de la ventana kiosco y registra en el log el total y los nombres de archivo (sin datos personales). Solo en desarrollo, `TOTEM_EXPORT_DIR` sustituye el diálogo.

### Arranque automático
- `app.setLoginItemSettings({ openAtLogin: true })`, solo en la app instalada.

### Instalador
- `npm run build:win` desde Linux genera `dist/totem-talento-0.1.0-setup.exe` (NSIS x64). No hay módulos en `node_modules` del paquete: todo va empaquetado por electron-vite. `content.json` queda en `resources\`, junto al ejecutable.

### README
- Desarrollo: `TOTEM_PANTALLA`, `TOTEM_NOMBRE` y `TOTEM_EXPORT_DIR`; PIN de fábrica.
- Dónde viven los datos y cómo editar `content.json` el día del evento.
- Checklist de despliegue (§19) y de prueba en el tótem (§17).

**Archivos:**
- Nuevos: `src/main/export.ts` y `src/main/export.test.ts`.
- Modificados:
  - `src/main/{ipc,index}.ts`, `src/preload/index.ts` y `src/shared/ipc.ts`.
  - `src/renderer/screens/Admin.tsx`, `src/renderer/state/useInactividad.ts` y `src/renderer/styles/global.css`.
  - `README.md`.

### Verificación
- 169 pruebas pasan, incluida `export.test.ts`: columnas, orden, BOM, escapado, fórmulas, nombre del archivo y un `.xlsx` que exceljs vuelve a leer con acentos y ñ. Typecheck, lint y prettier limpios.
- En el build real, manejado por CDP:
  - Los 5 toques abren el PIN; un PIN incorrecto se rechaza y `1234` entra.
  - Se ven los avisos y elegir T2 quita "ID sin confirmar".
  - La exportación escribe `registros_T2_2026-10-11_2018.xlsx` y `.csv` (con BOM y acentos).
  - Un PIN de confirmación distinto se rechaza; después se cambia el PIN.
  - Al volver al quiz, main bloquea el panel: el PIN viejo ya no sirve y el nuevo sí.
  - El panel se cierra solo por inactividad.
  - Sin errores de consola.

### Pendientes detectados
- Todo lo que solo se prueba en Windows: el diálogo de la USB encima de la ventana kiosco, el arranque automático, los gestos de borde y el instalador mismo. Está en la checklist del README.
