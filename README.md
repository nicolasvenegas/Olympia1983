# Emulador Olympia1983  

Ante la dificultad material de encontrar cinta de repuesto, desarrollamos esta aplicación que preserva digitalmente un comportamiento: virtualiza el conjunto de características de registro de la máquina de escribir electrónica
**Olympia AEG Carrera MD**.

---

## Características

- **Escritura permanente**: `Backspace`, `Delete`, cortar, pegar y deshacer están bloqueados. Cada carácter que se imprime queda grabado para siempre en la hoja.
- **Una única hoja**: formato Carta (US Letter, 215.9 × 279.4 mm). No existe
  segunda página ni scroll vertical: al llegar al final se puede seguir
  escribiendo y sobreimprimiendo, pero no bajar más.
- **Rejilla monoespaciada fija**: 73 columnas × 45 líneas, con el bloque de
  texto centrado en la hoja.
- **Sin ratón**: toda la interacción es por teclado; el cursor gráfico se
  oculta.
- **Sobreimpresión**: escribir sobre una celda ocupada añade otro glifo encima
  (append-only).
- **Exportación en imagen**: PNG a 300 DPI (2550 × 3300 px) con la
  resolución física incrustada.
- **Envío por correo (app de escritorio)**: botón **Enviar** que adjunta la
  hoja en PNG a un email vía SMTP, con los datos del servidor de correo
  configurables dentro de la app.

## Tipografía mecánica

Las propiedades tipográficas replican las especificaciones técnicas de la
Olympia AEG Carrera MD:

| Parámetro | Valor |
|---|---|
| Familia | Courier Prime (monoespaciado, estilo Pica) |
| Tamaño de tipo | 10–11 pt |
| Interlineado | 1.5 (selector físico 1 / 1.5 / 2) |
| Alto de línea | ≈ 5.3 mm (15 pt) |
| Paso de escritura | Pitch 10 (Pica): 10 caracteres por pulgada, 2.54 mm/carácter |

## Controles

| Tecla | Acción |
|---|---|
| Carácter imprimible | Imprime en la celda actual y avanza el carro |
| `Enter` | Salto de línea + retorno al margen izquierdo |
| `←` / `→` | Mueve el carro una columna |
| `↑` / `↓` | Cambia de línea conservando la columna |
| `Shift` + `↑` / `↓` | Salto de media línea (sobreíndice / subíndice) |
| `F2` | Exporta la hoja en PNG y crea una nueva en blanco |
| `Backspace` / `Delete` | Bloqueados: no existe el borrado |

## Exportación

Al pulsar `F2` (o el botón **Exportar**) la hoja actual se renderiza de nuevo
a resolución completa —independientemente de la resolución de edición— y se
descarga como PNG con el nombre:

```
DDMMYYYY_HHMM.png   (p. ej. 31122026_2159.png)
```

Tras exportar, la página se limpia y queda una hoja nueva en blanco, listo
para continuar.

## Modelo de datos

- `glyphs: { id, char, row, col, half, timestamp }[]` — lista *append-only* de
  caracteres impresos; nunca se elimina ni modifica.
- `cursor: { row, col, half }` — `col` puede valer `COLS` (carro en el margen
  derecho); `half` guarda el desplazamiento de media línea.
- `pageCounter` — numeración interna de hojas.

## Stack tecnológico

- **Vite + TypeScript + Canvas 2D** — sin editores de texto ni
  `contenteditable`.
- **Fuente monoespaciada**: Courier Prime, cargada con `document.fonts`.

## Desarrollo

```bash
npm install
npm run dev      # entorno de desarrollo
npm run build    # compilación y build de producción
```

## Cómo funciona y cómo publicar una versión nueva

### Arquitectura

La aplicación tiene **dos caras** que comparten el mismo código:

1. **Web** (`Vite + TypeScript + Canvas 2D`): se despliega públicamente como
   GitHub Page en <https://nicolasvenegas.github.io/Olympia1983/>. El build usa
   `base: "/Olympia1983/"` en `vite.config.ts` para que los recursos carguen bien
   bajo ese subdirectorio.
2. **Escritorio** (`Tauri 2`): un shell nativo (WebView2 de Windows) que envuelve
   la misma web y genera un instalador `.exe` descargable desde las *Releases*.
   Toda la estructura está en `src-tauri/` (`Cargo.toml`, `tauri.conf.json`,
   `src/main.rs`, iconos y capabilities).

### Cómo publicar una versión nueva del `.exe`

La compilación del instalador la hace GitHub Actions (no hace falta tener Rust
ni Visual Studio en el equipo local). Mediante el workflow
`.github/workflows/build.yml` que usa `tauri-apps/tauri-action`.

Para publicar una nueva versión **solo hay que crear y subir una etiqueta `v*`**:

```bash
# 1. Añadir los cambios y subirlos
git add -A
git commit -m "Descripción del cambio"
git push

# 2. Crear una etiqueta de versión y subirla (activa el workflow de build)
git tag v0.1.1
git push origin v0.1.1
```

El workflow compila automáticamente el frontend y el binario de Tauri en
Windows, y al final crea/actualiza la release con los instaladores:

- `Olympia1983_<versión>_x64-setup.exe` (instalador NSIS)
- `Olympia1983_<versión>_x64_en-US.msi`

También se puede disparar el workflow manualmente desde la pestaña **Actions**
(*Actions → Build Windows installer → Run workflow*), útil para generar
instaladores sin crear una etiqueta.

> El identificador de versión se toma de `src-tauri/tauri.conf.json`
> (`"version"`), mantenlo sincronizado con la etiqueta `v*`.

---

## Envío de la hoja por correo (solo escritorio)

La aplicación de escritorio puede **remitir la hoja actual como PNG adjunto**
directamente a una dirección de correo mediante SMTP, sin pasar por el cliente
de correo del sistema. En la versión web de GitHub Pages el botón **Enviar** no
aparece: un sitio estático no puede abrir conexiones SMTP por sí mismo.

### Cómo se usa

Pulsar el botón **Enviar** abre un diálogo con dos bloques:

1. **Datos del mensaje**
   - **Para** — correo del destinatario (obligatorio).
   - **Asunto** — por defecto `Hoja Olympia1983 DDMMYYYY_HHMM`.
   - **Mensaje** — texto libre que acompaña al adjunto.
2. **Ajustes del servidor SMTP** (desplegable)
   - **Servidor** (p. ej. `smtp.gmail.com`), **puerto** y **seguridad**
     (`STARTTLS` para 587, `TLS/SSL` para 465 o `Sin cifrado`).
   - **Usuario** y **contraseña** de la cuenta emisora.
   - **Remitente** — dirección que aparece en `From:`.

Al pulsar **Enviar**, la hoja se renderiza a 300 DPI (2550 × 3300 px), se
adjunta como `DDMMYYYY_HHMM.png` y se envía. Tras un envío correcto se abre
una hoja nueva en blanco, igual que al exportar. Los ajustes SMTP se guardan
en el almacenamiento local y quedan precargados la próxima vez.

> Para Gmail u Outlook se necesita una **contraseña de aplicación** (no la
> contraseña habitual de la cuenta).

### Límites y consideraciones

- El envío requiere **conexión a internet** y que el servidor SMTP acepte las
  credenciales configuradas (autenticación).
- Los servidores de correo suelen limitar el tamaño de adjuntos (habitualmente
  25 MB); a 300 DPI la imagen suele estar por debajo.
- La configuración quedan local, en `localStorage`; la contraseña se almacena
  sin cifrar en la máquina del usuario.

### Núcleo técnico

- `src-tauri/src/mail.rs` — comando `send_email` del backend Rust: construye el
  multipart con `lettre` (cuerpo `text/plain` + PNG `image/png` con
  `Content-Disposition: attachment`), elige transporte según el modo de
  seguridad (`starttls_relay`, `relay` o sin cifrado) y envía con la cuenta
  SMTP configurada.
- `src/mail.ts` — helpers del frontend: detecta si la app corre en Tauri
  (`isTauri()`), guarda/carga la configuración SMTP y dispara el comando desde
  el webview.
- `src/export.ts` — `renderPagePngBlob()` re-renderiza la hoja a resolución de
  exportación y devuelve el `Blob` con el parámetro `pHYs` (300 DPI) incrustado;
  lo comparten la exportación (`F2`) y el envío por correo.

---

## Colofón

**Licencia** · Este proyecto se distribuye bajo la
**GNU Affero General Public License versión 3 (AGPL-3.0)** o (a tu elección)
cualquier versión posterior. Consulta el archivo [LICENSE](LICENSE) para el
texto completo de la licencia.

Resumen práctico de la AGPL-3.0:

- **Uso libre** — puedes ejecutar, estudiar y modificar el software.
- **Copyleft** — cualquier copia o derivado debe publicarse bajo AGPL-3.0
  y con su código fuente.
- **Red/redes** — si una versión modificada se ofrece a través de una red
  (p. ej. un servidor web), debes ofrecer a sus usuarios el código fuente
  de esa versión.
- **Sin garantía** — el software se entrega "tal cual", sin garantías ni
  responsabilidad.

Este colofón se imprime como la última página de esta maqueta: como toda
hoja de esta máquina, no se puede borrar.
