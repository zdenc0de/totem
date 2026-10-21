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
- `npm run build:win` desde Linux genera `dist/totem-talento-0.1.0-setup.exe` (NSIS x64, ~112 MB). No hay módulos en `node_modules` del paquete: todo va empaquetado por electron-vite. `content.json` queda en `resources\`, junto al ejecutable.
- Al revisar el paquete aparecieron dos problemas:
  - Un `resources/app-update.yml` apuntando a GitHub. electron-builder lo deduce del remoto de git aunque no haya `publish`. Era inerte (no hay `electron-updater`), pero se quitó con `publish: null`, y `no-network.test.ts` ahora exige exactamente esa línea.
  - El `app.asar` incluía `.claude/`, `AGENTS.md`, `BITACORAS.md` y las imágenes de inspiración. Se excluyeron en `files`; ahora solo lleva `out/`, `package.json` y el ícono.

### README
- Desarrollo: `TOTEM_PANTALLA`, `TOTEM_NOMBRE` y `TOTEM_EXPORT_DIR`; PIN de fábrica.
- Dónde viven los datos y cómo editar `content.json` el día del evento.
- Checklist de despliegue (§19) y de prueba en el tótem (§17).

**Archivos:**
- Nuevos: `src/main/export.ts` y `src/main/export.test.ts`.
- Modificados:
  - `src/main/{ipc,index}.ts`, `src/preload/index.ts` y `src/shared/ipc.ts`.
  - `src/renderer/screens/Admin.tsx`, `src/renderer/state/useInactividad.ts` y `src/renderer/styles/global.css`.
  - `README.md`, `electron-builder.yml` y `src/no-network.test.ts`.

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

---

## 2026-10-13 — Boleto según los bocetos del cliente, con el mosaico de IDLE

**Fase:** 3 — Interfaz final (boleto)

### Referencia
- `assets/boletos_boceto/1.png`, `2.png` y `3.png`: un boleto por talento (Impulsor, Acelerador y Reflejo). Papel blanco plateado con borde dorado, pestaña arriba y muescas a los lados, logos de CONAIP × Eliot, el talento en azul con desfase magenta y cian, marco rojo para el QR y banda de Instagram. Las esquinas llevan tramas de puntos: azul a la izquierda y amarillo a la derecha.

### Talentos
- Los nombres pasan a los de los bocetos: `A` = **Acelerador**, `I` = **Impulsor** y `V` = **Reflejo**. Los códigos no cambian, así que los registros guardados y la lógica del resultado siguen igual.
- Las frases son las de los bocetos, sin punto final.
- Cambia en `resources/content.json` y en `CONTENIDO_POR_DEFECTO`. El panel admin y la exportación (columna "Talento (nombre)") usan estos mismos nombres.

### Boleto (`components/Ticket.tsx`)
- **Forma (SVG):** papel blanco con un degradado plateado y reflejos en diagonal, borde dorado en degradado, pestaña al centro arriba y una muesca a cada lado a la altura del QR. La sombra va en el SVG (estático) y no en el contenedor, para que los píxeles que laten encima no obliguen a recalcular el filtro.
- **Píxeles de las esquinas:** en vez de los puntos del boceto se usa el mosaico de IDLE: retícula de cuadros (24 px), trama que se encoge desde la esquina, píxeles sueltos donde se deshace, algunos parpadean y la trama late en onda. Cada lado lleva el color de la marca cuyo logo tiene arriba: azul CONAIP (con algún rojo) a la izquierda y amarillo Eliot (con algún negro) a la derecha.
  - Los textos y los logos van sobre papel limpio: cerca de ellos la trama se encoge hasta desaparecer (44 px).
  - El marco del QR y la banda de redes son opacos: la trama pasa por debajo, como en el boceto. Los cuadros que quedarían tapados por completo no se dibujan.
  - 327 cuadros, 265 de ellos laten (IDLE tiene 229).
- **Contenido:**
  - "Zdenko," (se ajusta de 80 a 30 px) y "tu tipo de talento es:".
  - El talento en mayúsculas, Poppins 900 en azul marino con el desfase magenta y cian del boceto. Se ajusta de 136 a 64 px: ACELERADOR queda en 98 px, IMPULSOR en 128 y REFLEJO en 136.
  - La frase, el marco rojo "Escanea aquí" con el QR de 480 px en su tarjeta blanca, "para descubrir tu juego" y la banda inclinada con Instagram @CONAIP_MX (ícono en SVG local).
  - "Escanea aquí" sustituye el "SCAN HERE" del boceto para que todo quede en español, y con "para descubrir tu juego" debajo forma una sola frase.
  - Con `showGameOnTicket`, el texto de abajo cambia por "Tu juego: …".
- **Entrada:** el boleto aterriza con el resorte de antes; los píxeles se arman de cada esquina hacia el centro y el nombre del talento "se sintoniza": dos copias magenta y cian brincan en pasos y se asientan (600 ms, solo `transform` y `opacity`). Respeta `prefers-reduced-motion`.
- La posición de cada bloque vive en constantes de `Ticket.tsx`, porque los píxeles las necesitan para esquivar el contenido.

### Píxeles compartidos
- `components/Pixeles.tsx` (nuevo): el render de los cuadros que antes estaba en `Mosaico.tsx`. IDLE y el boleto arman cada uno su composición y comparten este render y la animación de `.mosaico` en `global.css`.
- `components/aleatorio.ts` (nuevo): el PRNG con semilla fija (va aparte por la regla de fast refresh).

**Archivos:**
- Nuevos: `src/renderer/components/Pixeles.tsx` y `src/renderer/components/aleatorio.ts`.
- Modificados:
  - `src/renderer/components/{Ticket,Mosaico}.tsx` y `src/renderer/styles/{global,tokens}.css` (tokens `--azul-claro`, `--tinta`, `--cian` y `--magenta`).
  - `resources/content.json`, `src/shared/content.ts`, `src/shared/result.ts` y `src/renderer/state/dev.ts` (comentarios).
  - `src/main/{config,export}.test.ts` y `AGENTS.md` (§5, §6, §7, §12 y §18).

### Verificación
- 169 pruebas pasan; typecheck, lint y prettier limpios.
- Capturas a 1080×1920 por CDP, con una segunda ventana de Electron conectada al servidor de Vite que ya estaba abierto:
  - Los tres talentos: Acelerador con "Lu", Impulsor con "Maximilianoalejandrogarcia" (26 letras, 44 px) y Reflejo con 30 letras (32 px, una línea). Ninguno desborda.
  - `showGameOnTicket: true`: "Tu juego: Simulador de carreras" cabe y no toca los píxeles.
  - La entrada a los 0.45, 0.7, 0.9, 1.3 y 2.4 s.
- Con la CPU frenada 4×: IDLE a 59 fps con 205 capas y el boleto a 57 fps con 301 capas.

### Pendientes detectados
- Probar el escaneo del QR con el marco rojo en el tótem real (§17).
- Confirmar con el cliente que "Escanea aquí" puede sustituir "SCAN HERE".

---

## 2026-10-13 — El boleto solo con colores de CONAIP y Eliot

**Fase:** 3 — Interfaz final (boleto)

A petición del cliente, el boleto y su pantalla ya no usan colores fuera de las dos identidades.

### Paleta permitida
- CONAIP (`MANUAL DE IDENTIDAD.pdf`, págs. 8 y 9): rojo `#AC141C`, azul `#0C53A2`, blanco y negro (variantes del logo).
- Eliot (`assets/inspiration/Elliot_identidad_colores.jpeg`): Yellow X `#FFED00`, Yellow 1–6, negro, Black 80/60/40/20/10 % y blanco.

### Qué cambió
| Elemento | Antes | Ahora |
|---|---|---|
| Papel | Degradado plateado con reflejos translúcidos | Blanco con tres bandas diagonales en Black 10 % (`#E6E7E8`) |
| Borde | Degradado dorado | Yellow X |
| Talento | Azul marino `#083A73` con desfase magenta y cian | Azul CONAIP con desfase en rojo CONAIP y Yellow X |
| Copias de la entrada del talento | Magenta y cian al 90 %, encima del texto | Rojo y Yellow X opacos, detrás del texto |
| Píxeles CONAIP | Azul, azul oscuro, azul claro y rojo | Azul y rojo |
| Píxeles Eliot | Dorado `#F2B705`, Yellow X y negro | Trama en Yellow X; sueltos en Yellow X, Yellow 2, negro y Black 80 % |
| Textos | `#1D1D1B` | Negro |
| "×" entre logos | Azul marino | Black 80 % |
| Sombras del boleto y del marco del QR | Negro y rojo translúcidos | Sin sombra |
| Fondo de la pantalla | Degradado azul | Azul CONAIP plano, como IDLE |
| Tiempo de "Terminar" | Blanco translúcido sobre el rojo | Barra Yellow X de 12 px al pie del botón |

- Tokens: se quitan `--azul-claro`, `--tinta`, `--cian` y `--magenta`, y se agrega `--negro-10` (Black 10 %: se usa su RGB, 230, 231, 232, porque el hex del manual no le corresponde).
- El resto de las pantallas no cambia.

**Archivos:** `src/renderer/components/Ticket.tsx`, `src/renderer/styles/{global,tokens}.css` y `AGENTS.md` (§7 y §14).

### Verificación
- 169 pruebas pasan; typecheck, lint y prettier limpios.
- Capturas a 1080×1920 por CDP, con el boleto en reposo y a la mitad de la entrada del talento. En el CSS del boleto solo quedan tokens de las dos marcas, sin `rgba` ni degradados.

---

## 2026-10-13 — Las reglas de Reflejo dejan de llamarse "versátil"

**Fase:** 3 — Interfaz final

- Solo hay tres talentos: Acelerador (A), Impulsor (I) y Reflejo (V). "Versátil" era el nombre anterior de V y quedaba en las claves de las reglas, lo que hacía parecer que había un cuarto caso.
- Se renombran:
  - `reglas.versatilPorPregunta` → `reglas.reflejoPorPregunta`.
  - `reglas.empateVersatil` → `reglas.empateReflejo`.
  - `juegoVersatil` → `juegoReflejo` en `result.ts`.
- La lógica no cambia.
- Un `content.json` con las claves viejas ya no pasa el esquema; la app lo registra en el log y usa el siguiente archivo (§12). Aún no hay ninguno instalado en los tótems.

**Archivos:** `resources/content.json`, `src/shared/{content,result}.ts`, `src/shared/{content,result}.test.ts` y `AGENTS.md` (§12 y §18).

### Verificación
- 169 pruebas pasan, incluidos los casos obligatorios del §6 y las 243 combinaciones; typecheck, lint y prettier limpios.

## 2026-10-14 — Reflejo siempre al simulador, QR por talento y respaldo en USB en tiempo real

**Fase:** pruebas y correcciones (congelamiento de funciones). Lo pidió el cliente: proteger los registros (~1500) ante cualquier falla y que el Excel salga perfecto.

### Regla del juego y QR por talento
- El cliente confirmó que **Reflejo va siempre al simulador**, también cuando gana por desempate; coincide con las imágenes de `assets/tickets/tipoJuego/` (acelerador_simulador, impulsor_pera, reflejo_simulador).
- `reglas` queda solo como `juegoPorTalento: { A: simulador, I: pera, V: simulador }`; se quitan `reflejoPorPregunta` y `empateReflejo`. Las 243 combinaciones dan 192 simulador / 51 pera (A 51, I 51, V 141).
- Como cada talento lleva siempre al mismo juego, los **QR pasan a ser uno por talento** (`talentos.{A,I,V}.qrUrl` / `qrImage`), para que cada uno abra la página con la imagen de su talento. `juegos` solo conserva el nombre.
- Se revisaron las preguntas contra la tabla final del cliente: coinciden. Única diferencia de texto: la opción Acelerador de la pregunta 2 dice "precisión y estrategia." sin el "Con"; se deja como estaba hasta que confirmen (§18).

### Backend
- `storage.ts`:
  - Al arrancar **empareja principal y backup**: si la app murió entre las dos escrituras, al que le falte un registro se le agrega (antes el backup se quedaba sin él para siempre; se reprodujo matando el proceso).
  - Cada línea se valida **completa** al leerla (todos los campos y tipos). Antes solo se revisaban id, correo y teléfono, y una línea incompleta habría tumbado la exportación entera.
  - Cuenta los registros que no se pudieron escribir en ningún archivo (`fallos()`).
- `respaldo.ts` (nuevo): **USB de respaldo en tiempo real**.
  - Solo usa una unidad con la carpeta `TotemRespaldo` en la raíz y nunca la del sistema.
  - Cada registro se agrega a `registros_{T1}.jsonl` con fsync en el mismo momento en que se guarda en el disco.
  - `registros_{T1}.xlsx` y `.csv` se regeneran cada 10 registros o cada 30 s.
  - Si la USB se retira, el tótem sigue; al volver se pone al día sola (revisión cada 15 s). Nunca lanza errores hacia el flujo del participante.
- `export.ts`: Fecha como **fecha real de Excel** (`dd/mm/yyyy`, filtrable) y Hora en columna aparte, tomadas del texto ISO para que no cambien con la zona horaria de quien abra el archivo. Los archivos se escriben a `.tmp` + rename: nunca quedan a medias.
- IPC: `admin:prepararRespaldo` (crea la carpeta en la USB elegida) y `sistema:alerta` (público, solo un booleano). `admin:estado` agrega el respaldo, las fallas de guardado y la hora del tótem.

### Panel admin y pantalla de inicio
- El panel muestra la **fecha y hora del tótem** (sin internet no se sincronizan), la sección **Respaldo en USB** ("USB D:\ · 1500 de 1500 registros copiados · Excel de las 11:50") con el botón "Preparar USB", y avisos de: sin USB de respaldo, falla de la USB y registros no guardados.
- Para que todo quepa en 1920 px: los QR pendientes van en un solo aviso, los juegos en una línea de texto y el total más chico. Si aun así no cupiera, el panel se desplaza en vez de cortar botones.
- En IDLE, un **punto rojo pequeño** en la esquina inferior derecha avisa al staff que revise el panel.

**Archivos:** `resources/content.json`, `src/shared/{result,content,ipc}.ts`, `src/main/{storage,respaldo,export,config,ipc,index}.ts`, `src/main/storage.fixture.ts`, `src/preload/index.ts`, `src/renderer/screens/{Admin,Boleto,Idle}.tsx`, `src/renderer/styles/global.css`, pruebas (`result`, `content`, `config`, `storage`, `export` y la nueva `respaldo.test.ts`), `AGENTS.md` (§6, §7, §8, §9, §11, §12, §18 y §19) y `README.md`.

### Verificación
- 184 pruebas pasan (16 archivos), entre ellas 10 nuevas del respaldo: USB ausente, copia y Excel, cada 10 registros o por tiempo, desconexión y reconexión, USB vaciada, línea cortada en la USB, error de escritura y recuperación, peticiones simultáneas sin duplicados, cambio de ID y nunca la unidad del sistema. Typecheck y lint limpios (salvo los avisos de CRLF de la copia de trabajo en Windows).
- **Prueba end-to-end con la app compilada y una USB física (D:, FAT32)**, por el mismo IPC que usa la pantalla:
  - Sin la carpeta, el tótem enciende la alerta; "Preparar USB" la crea y la alerta se apaga.
  - 700 registros con nombres difíciles (acentos, ñ, apóstrofes, guiones, 60 caracteres) y correos con mayúsculas y espacios.
  - Ráfaga de 2000 y muerte del proceso a la mitad: al reabrir, 764 registros completos, iguales en el disco y en la USB.
  - USB "retirada" (carpeta renombrada): el tótem siguió registrando 100 más con la alerta encendida; al reconectarla se puso al día sola en 15 s.
  - Total 1500 y exportación manual desde el panel con PIN.
  - Resultado: **1500 registros idénticos en las 7 copias** (principal, backup, JSONL de la USB, Excel y CSV de la USB, Excel y CSV manuales), comparados celda por celda; teléfonos como texto, fecha como fecha de Excel, BOM en los CSV, sin temporales, sin duplicados, y todo Reflejo con simulador. Cero errores.
  - Tiempo por registro (revisar duplicado + guardar en disco y USB): mediana 3 ms, máximo 382 ms cuando coincide con la regeneración del Excel.
  - La USB quedó exactamente como estaba (solo se crearon y borraron `TotemRespaldo` y `PruebaTotem`).
- Instalador generado por primera vez en Windows: `dist/totem-talento-0.1.0-setup.exe` (112 MB), con `content.json` junto al ejecutable. No se instaló en la máquina de desarrollo porque arranca en kiosco y se registra para iniciar con Windows.

### Pendientes
- URLs finales de los 3 QR (página en Vercel).
- Probar en los tótems reales: táctil, resolución, diálogo de la USB, arranque automático y gestos de Windows.
- Las USB de los tótems: de preferencia formateadas en NTFS, que tiene journaling (la de prueba era FAT32 y funcionó, pero FAT32 y exFAT toleran peor los apagones).

## 2026-10-14 — Página del QR publicada en Vercel y QR reales en el tótem

**Fase:** pruebas y correcciones.

- `web/` (nuevo): página estática por talento (`/acelerador`, `/impulsor`, `/reflejo`) con la imagen del reto y dos botones:
  - **Compartir en mi historia**: menú de compartir del celular con el archivo (Web Share API); ahí se elige Instagram → Historia. Si el navegador no lo permite, se descarga y se explica cómo subirla.
  - **Guardar imagen**: descarga directa en Android (`conaip-eliot-{talento}.jpg`); en iPhone abre el menú para "Guardar imagen" (una descarga iría a "Archivos").
  - La imagen se precarga al abrir la página: Safari solo deja abrir el menú de compartir justo después del toque.
- Imágenes desde `assets/tickets/tipoJuego/` (PNG de 6.7 MB): `img/{talento}.jpg` a 1080×1920, calidad 85 (~350 KB), para compartir; `img/{talento}.webp` (~190 KB) para mostrar. El marco blanco alrededor del ticket viene opaco en el diseño del cliente y se respeta.
- Sin frameworks ni recursos de terceros, fuentes locales; cabeceras `nosniff`, `no-referrer` y caché de 1 día para imágenes y fuentes (`vercel.json`). `.env.local` y `.vercel` quedan fuera de git y del despliegue.
- Publicada en la cuenta Hobby de Vercel solo para pruebas: <https://totem-talento.vercel.app>. Antes del evento hay que decidir dónde queda la definitiva (Hobby es para uso no comercial).
- `resources/content.json`: `talentos.{A,I,V}.qrUrl` apuntan a las tres páginas.
- `electron-builder.yml` excluye `web/` del instalador; `eslint.config.mjs` quita la regla de tipos de retorno (de TypeScript) solo para `web/**/*.js`.

**Archivos:** `web/` (nuevo), `resources/content.json`, `electron-builder.yml`, `eslint.config.mjs` y `README.md`.

### Verificación
- Local, con Edge emulando Pixel 7 e iPhone 12: imagen a 1080×1920, cero peticiones a terceros, "Guardar imagen" descarga `conaip-eliot-reflejo.jpg` en Android y en iPhone muestra "En el menú, toca «Guardar imagen»".
- En Vercel: las tres rutas y los recursos responden 200 sin protección; `/.env.local` y `/.vercel/project.json` responden 404; las cabeceras se aplican.
- Los tres QR que genera la app (sin red) se decodifican exactamente a su URL (versión 4, fáciles de leer). El QR del boleto en pantalla se decodifica también desde una captura reducida; mide 480 px en el artboard (mínimo pedido: 380).

### Pendientes
- Probar con celulares reales (iPhone y Android): escanear desde el tótem, compartir a la historia y guardar en la galería.
- Decidir el alojamiento definitivo de la página y, si cambian las URLs, actualizar `content.json`.

## 2026-10-14 — Demo web de la app completa para que el cliente la revise

**Fase:** pruebas y correcciones.

- `demo/` (nuevo): la app del tótem completa en el navegador, publicada aparte de la página del QR: <https://totem-talento-demo.vercel.app>. Sirve para que el cliente recorra todo, valide cómo se ve y mande solo los cambios finales.
- Es el mismo renderer (`src/renderer`) sin cambios. Solo se sustituye `window.totem` por `demo/simulador.ts`, que implementa la misma `TotemApi` del preload (el typecheck lo obliga) y reutiliza la lógica real de main: `armarRegistro`, `generarQrs` y `tablaExport` / `aCsv` / `aXlsx`. Los registros se guardan en el `localStorage` de quien revisa; "Exportar a USB" descarga el Excel y el CSV tal como salen en el tótem.
- `demo/shims/` sustituye `fs` y `path` (los importan esos módulos para escribir en disco; la demo nunca los usa).
- `demo/guia.ts`: botón flotante "Guía de la demo" con los pasos, el PIN 1234 y "Borrar mis registros de prueba". Abierta la primera vez; no forma parte del tótem.
- `vite.demo.config.ts`, `tsconfig.demo.json` y scripts `build:demo`, `deploy:demo` y `typecheck:demo` (incluido en `typecheck`). `demo/dist` en `.gitignore`; `electron-builder.yml` excluye `demo/`.

**Archivos:** `demo/` (nuevo), `vite.demo.config.ts`, `tsconfig.demo.json`, `package.json`, `.gitignore`, `electron-builder.yml` y `README.md`.

### Verificación
- Recorrido completo con Edge, en local y sobre la URL publicada: inicio → registro (María José Núñez Peña, correo con mayúsculas) → 5 preguntas → calculando → boleto "María, tu tipo de talento es REFLEJO" con QR que se decodifica a `https://totem-talento.vercel.app/reflejo` → panel admin con PIN → "Exportar a USB" descarga `registros_T1_….xlsx` y `.csv`: correo normalizado, fecha como fecha de Excel, Reflejo → simulador, CSV con BOM y acentos. Cero errores en consola.
- Vista de celular (iPhone 12) revisada. `/.env.local` y `/.vercel/project.json` responden 404 en la demo publicada.

## 2026-10-14 — Publicación en Vercel desde GitHub para la página del QR y la demo

**Fase:** pruebas y correcciones.

- Problema: al conectar el repo de GitHub, los dos proyectos de Vercel compilaban desde la raíz: corrían el build de Electron (`out/`) y fallaban con "No Output Directory named dist found". Fallaban todos los push.
- Se configuró cada proyecto (API de Vercel, *Project Settings → Build and Deployment*):
  - `totem-talento` (página del QR): Root Directory `web`, sin build; se sirven los archivos estáticos con `web/vercel.json`.
  - `totem-talento-demo`: Root Directory `demo`, install `cd .. && ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci` (no descarga el binario de Electron, que la demo no usa), build `cd .. && npm run build:demo`, output `dist`.
- Desde ahora **cada push a `main` publica los dos**. Se quitó el script `deploy:demo` y las instrucciones de publicar con la CLI (con Root Directory ya no aplican).

**Archivos:** `README.md` (sección "Publicación en Vercel"), `demo/README.md` y `package.json`.

### Verificación
- Despliegue de los dos proyectos desde `main` (commit `363843f`): ambos Ready, con sus dominios `totem-talento.vercel.app` y `totem-talento-demo.vercel.app`.
- Página del QR: `/`, `/acelerador`, `/impulsor` y `/reflejo` responden 200 con el rediseño (`assets/…`), sin recursos rotos ni errores de JS (iPhone emulado). `package.json`, `src/…` y `.env.local` responden 404: solo se publica `web/`.
- Demo: flujo completo sobre la URL publicada (registro → quiz → boleto con QR a `/reflejo` → panel con PIN → Excel y CSV correctos), sin errores en consola; `package.json` y `src/…` responden 404.

## 2026-10-20 — Desempate a favor de la pera y atractor con los retos en acción

**Fase:** cambios del cliente tras la primera revisión.

### Por qué "casi no salía Acelerador"
- No era un error. Al revisar la demo se contestó siempre "la primera opción" esperando Acelerador, pero las opciones se barajan en cada pregunta (§5): la primera opción es de un talento al azar.
- Con respuestas al azar, la regla anterior (todo empate 2-2-1 → Reflejo) daba Reflejo 58 %, Acelerador 21 %, Impulsor 21 %, y solo el 21 % a la pera. El 37 % de las combinaciones son empates y todos iban a Reflejo, incluso el empate Acelerador-Impulsor.

### Nueva regla de desempate (configurable)
- El cliente pidió mantener las opciones al azar y que más gente termine en la pera (es el juego más rápido).
- `reglas.desempate` en `content.json`:
  - Empates A-I e I-V → Impulsor (pera).
  - Empate A-V → Impulsor si su única respuesta Impulsor está en `impulsorDesempataEn` (hoy `[2, 4]`); si no, Acelerador.
- Con respuestas al azar: **pera 50.6 %**, simulador 49.4 %; Acelerador 28.4 %, Impulsor 50.6 %, Reflejo 21.0 %. Cada pregunta que se agregue a `impulsorDesempataEn` sube la pera ~2.5 puntos (hasta 58 %) sin reinstalar.
- `result.ts`: `desempatar()`; esquema en `content.ts` (cada par solo acepta a sus dos talentos y las preguntas van de 1 a 5, sin repetir).

### Pantalla inicial: los retos en acción
- La zona central de IDLE alterna en loop, con fundido: el mosaico de marca (7 s), el coche del simulador (6 s) y la pera de box (6 s).
  - Simulador: coche de píxeles que entra, corre en su lugar con las ruedas girando, rebote, líneas de velocidad y la pista moviéndose, con bandera a cuadros ondeando, y sale disparado.
  - Pera: guante que golpea tres veces por escena, la pera oscila desde su cadena y salta un destello en cada golpe.
  - Los nombres "¡Simulador de carreras!" y "¡Pera de box!" entran con el mismo desfase de color del boleto, y en la bajada se ilumina el juego en escena.
- Todo en píxeles del lenguaje de Eliot, dibujados en código (`components/figura.ts`, `Sprite.tsx`, `Retos.tsx`): sin imágenes nuevas, sin red. Solo `transform` y `opacity`, en loops CSS.
- El borde de píxeles bajo la banda de logos (`BordeBanda`) queda fijo mientras cambian las escenas.
- README: activar los efectos de animación de Windows en el tótem (si no, el mosaico se queda quieto).

**Archivos:** `src/shared/{result,content}.ts`, `src/shared/result.test.ts`, `resources/content.json`, `src/renderer/screens/Idle.tsx`, `src/renderer/components/{Retos,Sprite,Mosaico}.tsx`, `src/renderer/components/figura.ts` y `figura.test.ts` (nuevos), `src/renderer/styles/global.css`, `AGENTS.md` (§4, §6 y §12) y `README.md`.

### Verificación
- 193 pruebas pasan: 16 casos fijos del desempate, la distribución sobre las 243 combinaciones (A 69, I 123, V 51; 123 a la pera), la escalera de `impulsorDesempataEn` (111 / 117 / 123 / 129 / 141 a la pera) y el dibujante de píxeles. Typecheck (node, web y demo), lint y build de la demo limpios.
- App compilada: ciclo completo mosaico → simulador → pera → mosaico capturado en pantalla; las tres escenas corren a la frecuencia del monitor (145 fps en la máquina de desarrollo) y no invaden el titular (escenas hasta y = 1060, titular desde y = 1118).

### Pendientes
- Verlo en el tótem real (hardware desconocido) y con el cliente en la demo.

## 2026-10-20 — Atractor más ágil y textos de IDLE centrados

**Fase:** cambios del cliente.

- El mosaico de marca dura 5 s en el loop de IDLE (antes 7 s), para que el ciclo se sienta más fluido: mosaico 5 s → simulador 6 s → pera 6 s (17 s por vuelta).
- El titular "Descubre tu talento y acepta el reto" y la bajada "5 preguntas deciden tu reto…" van centrados (la bajada sola a la izquierda se veía dispareja).

**Archivos:** `src/renderer/screens/Idle.tsx`, `src/renderer/styles/global.css` y `AGENTS.md` (§4).

### Verificación
- App compilada: escenas en 0–5 s mosaico, 5–11 s simulador, 11–17 s pera y de vuelta al mosaico; 144 fps; titular y bajada centrados (capturas revisadas).

## 2026-10-21 — Una sola memoria para los dos tótems y versión 0.2.0 para la prueba

**Fase:** prueba en los tótems reales.

- Escenario de hoy: una sola memoria para instalar en los dos tótems; uno se queda con ella como respaldo y el otro trabaja sin memoria (sus registros quedan en su disco y se exportan al final).
- Riesgo encontrado: un tótem recién instalado arranca como T1 sin confirmar. Si la memoria del otro tótem llegaba antes de elegir T2 y ya había registros, escribía en `registros_T1.jsonl` y regeneraba `registros_T1.xlsx` solo con sus registros, tapando los del otro.
- `respaldo.ts`:
  - **No escribe en la memoria hasta que el ID esté confirmado** (`idConfirmado`; error `SIN_ID`, el panel dice "Elige T1 o T2 para empezar a copiar los registros" y la alerta de IDLE sigue encendida).
  - El Excel de la memoria se arma con **todo lo que contiene el archivo de la memoria**, no solo con lo del tótem conectado.
  - El Excel se regenera **con cada registro** (antes cada 10 o cada 30 s): si retiran la memoria justo después de un registro, el Excel ya lo tiene.
- Versión 0.2.0 (`package.json` y `package-lock.json`). Instalador `dist/totem-talento-0.2.0-setup.exe` copiado a la memoria (`TotemTalento-instalador\`) con un `LEEME.txt`: instalación, configuración de Windows, orden ID → memoria, tótem sin memoria, pruebas y cómo borrar los registros de prueba antes del evento.

**Archivos:** `src/main/{respaldo,index}.ts`, `src/main/respaldo.test.ts`, `src/renderer/screens/Admin.tsx`, `package.json`, `package-lock.json`, `AGENTS.md` (§9) y `README.md`.

### Verificación
- 195 pruebas pasan (2 nuevas: no escribe sin ID confirmado; el Excel incluye lo que ya traía el archivo). Typecheck y lint limpios.
- Simulación de dos tótems con la memoria física D: (dos carpetas de datos): A prepara la memoria, elige T1 y registra 3 → T1 con 3 líneas y 3 filas. B registra 2 sin ID → la memoria no cambia (T1 sigue con 3/3) y B marca `SIN_ID` con alerta. B elige T2 → `registros_T2` con 2/2 y T1 intacto. Cero errores; la memoria quedó como estaba.
- Estrés de 1500 registros con la memoria física y Excel por registro: 1500 idénticos en las 7 copias, muerte del proceso a media ráfaga (815 completos al reabrir) y memoria retirada y reconectada (al día en 15 s). Mediana 3.8 ms por registro. Cero errores.
- Instalador 0.2.0: el paquete trae el desempate nuevo, las URLs de los QR, el atractor y la protección del ID; la copia en la memoria es idéntica (SHA-256).

### Pendientes
- Resultados de la prueba en los tótems reales.
- Antes del evento: borrar los registros de prueba de los dos tótems y de la memoria (pasos en el LEEME).
