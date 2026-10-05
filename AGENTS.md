# AGENTS.md — App de Tótem: Quiz de Talento CONAIP × Eliot Awards

## 1. Resumen
App de kiosco para 2 tótems táctiles con Windows 11. El participante se registra (nombre, correo, teléfono), acepta el aviso de privacidad y responde un quiz de 5 preguntas. Al terminar ve un **boleto personalizado** en pantalla con su tipo de talento y un **QR** que, al escanearlo con su celular, le muestra la foto del juego que le toca. Después la app regresa sola a la pantalla de inicio.

- Evento: 1 día, alta afluencia, 2 tótems. Sin impresora.
- **Fecha límite de desarrollo: viernes 16 de octubre de 2026** (entrega final el 18).

## 2. Restricciones NO negociables
1. **Cero internet en el tótem.** Ningún recurso remoto: nada de CDNs, Google Fonts, analytics, telemetría ni auto-update. Todo (fuentes, imágenes, librerías) va empaquetado. La app debe funcionar idéntica con el cable de red desconectado.
2. **Windows 11 normal**, con acceso de administrador. Pantalla vertical; resolución exacta desconocida.
3. **Modo kiosco:** pantalla completa, sin barra de título, sin forma de salir sin PIN, resistente a toques erráticos.
4. **No perder registros nunca:** cada registro se escribe a disco en el momento en que se completa.
5. El código del tótem no debe hacer ninguna petición de red. Agregar una prueba o revisión que lo garantice (CSP estricta + bloqueo de requests en `session`).

## 3. Stack
- **Electron** (última estable) + **electron-vite** (plantilla `@quick-start/electron`, React + TypeScript)
- **React 18 + TypeScript**, estado del flujo con `useReducer` (máquina de estados simple)
- **Framer Motion** para transiciones y animaciones
- **qrcode** (npm) para generar los QR localmente a partir de una URL, sin red
- **exceljs** para exportar a .xlsx
- **@fontsource/poppins** (fuentes locales)
- **Persistencia:** archivo JSONL de solo agregar líneas (ver §9). **Sin módulos nativos**, para que el build de Windows no dependa de recompilaciones.
- **electron-builder** → instalador NSIS para Windows x64
- **Vitest** para pruebas unitarias de la lógica

## 4. Flujo de pantallas
```
IDLE (atractor animado, "Toca para comenzar")
  → REGISTRO (nombre, correo, teléfono) + casilla de aviso de privacidad
  → QUIZ (5 preguntas, una por pantalla, barra de progreso, botón "Atrás")
  → CALCULANDO (animación breve, ~1.5 s, solo efecto)
  → BOLETO (personalizado + QR) — botón "Terminar"
  → IDLE
```
- **Inactividad:** a los 45 s sin toques en cualquier pantalla que no sea IDLE, se muestra el modal "¿Sigues ahí?" con una cuenta regresiva de 15 s; si nadie responde, se borra todo y se vuelve a IDLE. Valores en config.
- **BOLETO:** regresa solo a IDLE a los 60 s (configurable) o al tocar "Terminar".
- Al volver a IDLE se limpia **todo** el estado: no puede quedar ningún dato del participante anterior.
- El registro se guarda **solo al completar el quiz**. Los abandonos no se guardan.

## 5. Contenido del quiz
Tres talentos: `A` = Acelerador, `I` = Impacto, `V` = Versátil.

| # | Pregunta | A · Acelerador | I · Impacto | V · Versátil |
|---|---|---|---|---|
| 1 | ¿Dónde crees que se aprende más? | En los retos. | En la experiencia de todos los días. | Probando situaciones diferentes. |
| 2 | ¿Cómo prefieres demostrar tu talento? | Con precisión y estrategia. | Con fuerza y determinación. | Resolviendo sobre la marcha. |
| 3 | ¿Qué vale más de tu trayectoria laboral? | Lo que me ayudó a crecer. | Lo que conseguí con esfuerzo. | Todo lo que aprendí en el camino. |
| 4 | ¿Cuál describe mejor tu situación actual? | Quiero llevar mi carrera más lejos. | Quiero que reconozcan lo que sé. | Quiero aprovechar mejor mi experiencia. |
| 5 | ¿Qué te gustaría hacer con todo lo que ya sabes? | Llegar al siguiente nivel. | Hacer que mi experiencia tenga valor. | Convertirlo en nuevas oportunidades. |

- **Barajar el orden de las 3 opciones en cada pregunta** para que no se note el patrón de columnas. Nunca mostrar el nombre del talento junto a las opciones.
- Mayúsculas iniciales normalizadas, como en la tabla.

## 6. Lógica de resultado (función pura — `src/shared/result.ts`)
Entrada: arreglo de 5 respuestas, cada una `'A' | 'I' | 'V'` (índice 0 = pregunta 1).

**Paso 1 — Talento**
- Contar A, I y V.
- Si un talento tiene el máximo **único** → ese talento.
- Si hay empate en el máximo (solo puede ser 2-2-1) → **V (Versátil)**, con `desempate = true`.

**Paso 2 — Juego**
- `A` → `simulador`
- `I` → `pera`
- `V` → se revisan las preguntas en las que eligió la opción V:
  - Preguntas que cuentan para **simulador**: 1 y 3
  - Preguntas que cuentan para **pera**: 2, 4 y 5
  - Gana el lado con más votos. **Empate → `pera`.**
  - (Garantía: cuando el resultado es V, siempre hay al menos 1 respuesta V.)

El mapeo de preguntas a juego, el juego por talento y la regla de empate van en config (§12), no fijos en el código.

**Casos de prueba obligatorios** (respuestas Q1..Q5 → talento / juego):
| Respuestas | Talento | Juego |
|---|---|---|
| A A A I V | A | simulador |
| I I I A V | I | pera |
| V V V A I | V (V en Q1,Q2,Q3 → 2 sim vs 1 pera) | simulador |
| A A I I V | V (empate) — V en Q5 | pera |
| V A A I I | V (empate) — V en Q1 | simulador |
| A V I I A | V (empate) — V en Q2 | pera |
| V V A A I | V (empate) — V en Q1,Q2 → 1-1 | pera |
| V A V A I | V (empate) — V en Q1,Q3 | simulador |
| V V V V V | V — 2 sim vs 3 pera | pera |

Agregar una prueba que recorra las 243 combinaciones y verifique: siempre hay resultado, el juego siempre es válido y la distribución es 81 simulador / 162 pera (A 51, I 51, V 141).

## 7. Boleto (pantalla de resultado)
Referencia visual: boleto vertical con forma de ticket (muescas laterales), franja superior blanca con los logos de CONAIP y Eliot Awards, fondo azul con franjas diagonales rojas, borde dorado.
Contenido:
- `"{PrimerNombre}, tu tipo de talento es"`
- Nombre del talento en grande: **Talento Acelerador / Talento de Impacto / Talento Versátil**
- Frase descriptiva del talento (PENDIENTE — usar placeholders desde config)
- QR del juego asignado, sobre una tarjeta blanca
- Banda inferior: **"ESCANEA | para descubrir tu juego"**
- El nombre del juego **no** se muestra en pantalla por defecto; se descubre con el QR. Dejarlo como opción en config: `showGameOnTicket: false`.

**Nombre:** usar el primer nombre, capitalizado ("zDENKO" → "Zdenko"). La tipografía se ajusta automáticamente para nombres largos (sin cortar ni desbordar). Probar con nombres de 25+ caracteres.

## 8. QR
- Hay **2 QR, uno por juego** (`simulador`, `pera`). Cada uno apunta a una URL donde está alojada la foto del juego. El celular usa su propio internet; el tótem no.
- La URL de cada juego va en config, y el QR se genera **localmente** con `qrcode` al arrancar (data URL). Si el cliente entrega PNGs de QR ya hechos, la config permite usar una imagen en lugar de una URL.
- Corrección de errores nivel M o mayor, margen blanco (quiet zone) adecuado y tamaño en pantalla de al menos 380 px para escanearlo fácil desde el celular.

## 9. Datos y persistencia
**Ubicación:** `app.getPath('userData')/data/`
- `registros.jsonl` — un registro JSON por línea. Se escribe con open → write → `fsync` → close.
- `backup/registros_backup.jsonl` — copia espejo escrita en el mismo momento.
- `settings.json` — ID de tótem (`T1`/`T2`) y PIN si se cambió.

**Registro:**
```ts
type Registro = {
  id: string;            // crypto.randomUUID()
  totemId: 'T1' | 'T2';
  createdAt: string;     // ISO con zona horaria local
  nombre: string;
  email: string;         // normalizado: trim + lowercase
  telefono: string;      // 10 dígitos
  aceptoPrivacidad: true;
  privacyVersion: string;
  respuestas: ('A'|'I'|'V')[]; // Q1..Q5
  conteo: { A: number; I: number; V: number };
  talento: 'A' | 'I' | 'V';
  juego: 'simulador' | 'pera';
  desempate: boolean;
  duracionSeg: number;   // de REGISTRO a BOLETO
};
```

**Duplicados:** NO se permiten correos repetidos en el mismo tótem. Al arrancar, se carga en memoria un `Set` con los correos guardados. En REGISTRO, al tocar "Continuar", si el correo ya existe se muestra: *"Este correo ya participó. Regístrate con otro correo."* No se puede verificar contra el otro tótem (no hay red); la exportación incluye una columna para detectar duplicados al unir archivos.
- La validación se hace en el proceso principal vía IPC (`registro:existeEmail`) y se vuelve a verificar al guardar.

**Comunicación renderer ↔ main:** solo vía `preload` con `contextBridge`. API mínima: `existeEmail`, `guardarRegistro`, `getConfig`, `admin.*`.

## 10. Registro: validaciones
- **Nombre:** obligatorio, de 2 a 60 caracteres, letras, espacios, acentos, ñ, apóstrofe y guion.
- **Correo:** obligatorio, regex razonable, máximo 80 caracteres, normalizado a minúsculas.
- **Teléfono:** obligatorio, exactamente 10 dígitos (México); solo teclado numérico.
- **Aviso de privacidad:** casilla obligatoria + enlace "Ver aviso de privacidad" que abre un modal con scroll. El texto viene de config (PENDIENTE del cliente).
- Errores debajo de cada campo, en lenguaje amable. El botón "Continuar" queda deshabilitado hasta que todo sea válido.

**Teclado en pantalla propio (obligatorio):** no depender del teclado táctil de Windows.
- Inputs con `inputMode="none"` para que Windows no abra su teclado.
- Diseños: alfabético (con ñ y acentos), correo (con `@`, `.` y atajos `@gmail.com`, `@hotmail.com`, `@outlook.com`, `.com`) y numérico para el teléfono.
- Teclas grandes (mínimo 80 px), retroalimentación visual al tocar, borrar y espacio.

## 11. Panel de administrador
- **Acceso:** 5 toques en la esquina superior izquierda en menos de 3 s, en IDLE → PIN numérico (default en config, cambiable desde el panel).
- Funciones:
  - Estadísticas: total de registros, por talento y por juego.
  - **Exportar a Excel (.xlsx)** con diálogo para elegir la USB. Nombre: `registros_{T1}_{YYYY-MM-DD_HHmm}.xlsx`. Columnas: todos los campos del registro, con las respuestas en columnas Q1..Q5, y los nombres legibles de talento y juego.
  - Exportar también a CSV (UTF-8 con BOM, para que Excel muestre bien los acentos).
  - Configurar el ID del tótem (T1/T2).
  - Volver al quiz / Salir de la app.
- El panel también se cierra solo por inactividad.

## 12. Configuración externa (`resources/content.json`)
Se empaqueta como `extraResources` y se lee al arrancar, para poder cambiar textos sin recompilar. Validarlo con un esquema (zod); si es inválido, usar los valores por defecto y registrar el error en el log.
```json
{
  "talentos": {
    "A": { "nombre": "Talento Acelerador", "frase": "PENDIENTE" },
    "I": { "nombre": "Talento de Impacto", "frase": "PENDIENTE" },
    "V": { "nombre": "Talento Versátil",  "frase": "PENDIENTE" }
  },
  "juegos": {
    "simulador": { "nombre": "Simulador de carreras", "qrUrl": "PENDIENTE", "qrImage": null },
    "pera":      { "nombre": "Pera de box",           "qrUrl": "PENDIENTE", "qrImage": null }
  },
  "reglas": {
    "juegoPorTalento": { "A": "simulador", "I": "pera" },
    "versatilPorPregunta": ["simulador", "pera", "simulador", "pera", "pera"],
    "empateVersatil": "pera"
  },
  "tiempos": { "inactividadSeg": 45, "avisoInactividadSeg": 15, "boletoSeg": 60 },
  "showGameOnTicket": false,
  "privacidad": { "version": "v1", "texto": "PENDIENTE" },
  "adminPinDefault": "PENDIENTE"
}
```

## 13. Endurecimiento de Electron (modo kiosco)
- `BrowserWindow({ kiosk: true, fullscreen: true, frame: false, autoHideMenuBar: true })`
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `devTools` solo en desarrollo
- CSP: `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'`
- Bloquear toda request que no sea `file://` o `app://` con `session.webRequest.onBeforeRequest`
- Bloquear `will-navigate`, `setWindowOpenHandler → deny` y negar todas las solicitudes de permisos
- `webContents.setVisualZoomLevelLimits(1, 1)`: sin pinch-zoom
- Sin menú contextual, sin selección de texto (`user-select: none`), sin arrastrar imágenes
- `app.requestSingleInstanceLock()`
- `powerSaveBlocker.start('prevent-display-sleep')`
- `render-process-gone` / `unresponsive` → recargar automáticamente y volver a IDLE
- Arranque automático al iniciar sesión en Windows (`app.setLoginItemSettings({ openAtLogin: true })`)
- Log a archivo en `userData/logs/` (errores, inicio y cierre, exportaciones). Nunca registrar datos personales en el log.

## 14. Diseño e identidad
- **Artboard fijo 1080×1920**, escalado con `transform: scale()` para ajustarse a cualquier resolución vertical (letterbox) y blindarse contra el escalado DPI de Windows. Sin scroll en ninguna pantalla.
- Colores (variables CSS en `:root`):
  - `--rojo: #AC141C` (POR CONFIRMAR: el manual también dice RGB 172, 20, 18)
  - `--azul: #0C53A2`
  - Acentos del boleto de referencia: dorado/amarillo y blanco
- Tipografía: **Century Gothic** si el cliente entrega los archivos con licencia; si no, **Poppins** (local). Definir una `font-family` con fallback.
- Botones de mínimo 96 px de alto, texto grande y legible a 1 m. Feedback inmediato al tocar (escala o color), aunque la acción tarde.
- Assets en `src/renderer/assets/`: logos CONAIP y Eliot (PENDIENTES en alta), fondos y texturas.
- Animaciones fluidas pero ligeras (el hardware del tótem es desconocido): usar solo `transform` y `opacity`.

## 15. Estructura sugerida
```
src/
  main/            # proceso principal: ventana kiosco, IPC, storage, export, logs
    storage.ts     # JSONL + backup + Set de emails
    export.ts      # exceljs / csv
    config.ts      # lectura y validación de content.json
  preload/
    index.ts       # contextBridge API
  shared/
    result.ts      # lógica pura del resultado (+ result.test.ts)
    types.ts
    validation.ts  # validaciones de registro (+ tests)
  renderer/
    screens/       # Idle, Registro, Quiz, Calculando, Boleto, Admin
    components/    # Teclado, Stage (escalado), Ticket, Modal, ProgressBar
    state/         # reducer de la máquina de estados + hook de inactividad
    styles/        # tokens.css, fuentes
resources/
  content.json
```

## 16. Fases de trabajo (hacer UNA a la vez y validar antes de seguir)
- **Fase 0 — Base (5 oct):** proyecto con electron-vite, ventana kiosco, Stage 1080×1920 con escalado, navegación entre las 6 pantallas con contenido provisional, CSP y bloqueo de red.
- **Fase 1 — Lógica (6–7 oct):** `result.ts` con todas sus pruebas, `validation.ts`, storage JSONL con fsync y backup, IPC, chequeo de duplicados, temporizador de inactividad y limpieza de estado.
- **Fase 2 — Registro y quiz (7–9 oct):** teclado en pantalla, formulario, aviso de privacidad, quiz con opciones barajadas y botón atrás.
- **Fase 3 — Interfaz final (9–12 oct):** IDLE animado, boleto personalizado, QR, transiciones e identidad visual.
- **Fase 4 — Admin y entrega (12–13 oct):** panel admin, export xlsx/csv, ID de tótem, instalador NSIS, arranque automático.
- **14 oct: congelamiento de funciones.** Del 14 al 16, solo pruebas y correcciones.

## 17. Criterios de aceptación
- Con el cable de red desconectado, el flujo completo funciona igual.
- 300 registros seguidos sin errores ni degradación; los registros sobreviven a matar el proceso a la mitad.
- Un correo repetido se bloquea con el mensaje correcto.
- Después del timeout de inactividad no queda ningún dato del usuario anterior en pantalla ni en el estado.
- El boleto se ve bien con nombres de 2 y de 30 caracteres.
- El QR se escanea a la primera con iPhone y Android a 30–50 cm.
- El Excel exportado abre en Excel con acentos y ñ correctos.
- Es imposible salir de la app sin el PIN (probar Alt+Tab, Alt+F4, gestos de borde y toques múltiples).

## 18. Pendientes del cliente (usar placeholders mientras llegan)
- Frases descriptivas de los 3 talentos
- URLs (o PNGs de QR) de las fotos de los 2 juegos, y quién aloja las fotos
- Texto del aviso de privacidad
- Logos en alta, fondos y diseños finales
- Archivos y licencia de Century Gothic; aclarar el RGB del rojo
- Confirmar: empate de votos versátiles → pera; ¿se elimina la pregunta bonus de CONAIP?; ¿duplicados también por teléfono?
- PIN de administrador

## 19. Despliegue en Windows (checklist, fuera del código)
Pausar Windows Update, desactivar notificaciones (Asistente de concentración), suspensión y apagado de pantalla en "Nunca", desactivar gestos de borde (`HKLM\SOFTWARE\Policies\Microsoft\Windows\EdgeUI\AllowEdgeSwipe = 0`), desactivar la aparición automática del teclado táctil, inicio de sesión automático, escalado de pantalla al 100% y ocultar la barra de tareas. Configurar un tótem como T1 y el otro como T2 desde el panel admin.


## Notas:
Al realizar commits, NUNCA agregarte como co autor.