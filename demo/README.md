# Demo web para revisión

Versión de la app del tótem que corre en cualquier navegador, para que el cliente recorra todo y pida los cambios finales: <https://totem-talento-demo.vercel.app>

- Son las mismas pantallas y el mismo código del tótem (`src/renderer`). Lo único distinto es `window.totem`: en lugar del proceso principal, `simulador.ts` guarda en el navegador de quien revisa (`localStorage`).
- El simulador reutiliza la lógica real de main: `armarRegistro` (validación y resultado), `generarQrs` (los mismos QR) y `tablaExport` / `aCsv` / `aXlsx` ("Exportar a USB" descarga el Excel y el CSV idénticos a los del tótem).
- `shims/` sustituye `fs` y `path`, que esos módulos importan para escribir en disco; la demo nunca los usa.
- La USB de respaldo aparece siempre conectada y no hay alertas: en la demo no hay disco.
- `guia.ts`: botón flotante con instrucciones (PIN 1234, cómo entrar al panel) y "Borrar mis registros de prueba". No forma parte del tótem.
- No se empaqueta en el instalador (`electron-builder.yml` excluye `demo/`).

```bash
npm run build:demo     # genera demo/dist para probarla localmente
```

Se publica sola con cada push a `main` (proyecto `totem-talento-demo` en Vercel, Root Directory `demo`; ver el README principal).
