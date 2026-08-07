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
- **Exportación en imagen**: PNG a 1200 DPI (10200 × 13200 px) con la
  resolución física incrustada.

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
