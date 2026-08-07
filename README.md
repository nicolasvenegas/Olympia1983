# Emulador Olympia MD  

Ante la dificultad material de encontrar cinta de repuesto, desarrollamos esta aplicación que virtualiza el conjunto de características de registro de la máquina de escribir electrónica
**Olympia AEG Carrera MD**.

---

## Características

- **Escritura permanente**: `Backspace`, `Delete`, cortar, pegar y deshacer están bloqueados. Cada carácter que se imprime queda grabado para siempre en la hoja.
- **Una única hoja**: formato Carta (US Letter, 215.9 × 279.4 mm). No existe
  segunda página ni scroll vertical: al llegar al final se puede seguir
  escribiendo y sobreimprimiendo, pero no bajar más.
- **Rejilla monoespaciada fija**: 73 columnas × 37 líneas, derivadas de la
  mecánica real de la máquina.
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
| Alto de línea | ≈ 6.3 mm (18 pt) |
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

## Envío por correo (solo escritorio)

En la aplicación de escritorio (Tauri) el botón **Enviar** abre un diálogo para
mandar la hoja actual por correo: destinatario, asunto, mensaje y datos del
servidor SMTP (servidor, puerto, seguridad, usuario, contraseña y remitente).

El PNG a 300 DPI se adjunta como `DDMMYYYY_HHMM.png`. La configuración SMTP se
guarda localmente para las siguientes hojas. Tras un envío correcto se abre
una hoja nueva en blanco.

En la versión web de GitHub Pages el botón de envío no aparece: un sitio
estático no puede abrir conexiones SMTP por sí mismo.

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
   GitHub Page en <https://nicolasvenegas.github.io/olympiaMD/>. El build usa
   `base: "/olympiaMD/"` en `vite.config.ts` para que los recursos carguen bien
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

- `Olympia.MD_<versión>_x64-setup.exe` (instalador NSIS)
- `Olympia.MD_<versión>_x64_en-US.msi`

También se puede disparar el workflow manualmente desde la pestaña **Actions**
(*Actions → Build Windows installer → Run workflow*), útil para generar
instaladores sin crear una etiqueta.

> El identificador de versión se toma de `src-tauri/tauri.conf.json`
> (`"version"`), mantenlo sincronizado con la etiqueta `v*`.

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
