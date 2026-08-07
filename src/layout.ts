/**
 * Configuración geométrica de la hoja Carta (US Letter) y de la rejilla
 * monoespaciada fija de la máquina de escribir.
 *
 * Toda medida de pixel se deriva del DPI, de modo que el tamaño físico de
 * los caracteres se mantiene constante y es idéntico entre edición y salida.
 *
 * La EDICIÓN se hace sobre un lienzo ligero (300 DPI) y la EXPORTACIÓN se
 * genera en alta resolución (1200 DPI) escalando el mismo render vectorial.
 *
 * Carta = 8.5 in × 11 in.
 */
export const DPI = 150; // resolución del lienzo de edición
export const EXPORT_DPI = 1200; // resolución del PNG exportado

/** Convierte pulgadas en píxeles para el DPI actual. */
const px = (inches: number) => Math.round(inches * DPI);

// Hoja en pulgadas.
export const PAGE_W = px(8.5);
export const PAGE_H = px(11);

// Márgenes mecánicos (en pulgadas).
export const MARGIN_LEFT = px(160 / 300);
export const MARGIN_RIGHT = px(160 / 300);
export const MARGIN_TOP = px(240 / 300);
export const MARGIN_BOTTOM = px(220 / 300);

/** Tamaño de cuerpo en puntos reales (se convierte a píxeles por DPI). */
const FONT_SIZE_PT = 10; // 10–11 pt (pica de oficina)

/**
 * Proporciones de la fuente monoespaciada móvil, ajustadas a las
 * especificaciones de la Olympia AEG Carrera MD:
 *  - CHAR_KERN (avance/glifo): pitch Pica = 10 cpp/in → 7.2 pt de ancho por
 *    carácter sobre un cuerpo de 10 pt ⇒ 0.72.
 *  - LINE_HEIGHT_KERN (interlineado): selector 1.5 ⇒ 1.5 × 4.23 mm = 6.35 mm ≈
 *    18 pt de alto de línea sobre cuerpo de 10 pt ⇒ 1.8.
 */
const CHAR_KERN = 0.72; // 10 cpi (Pica): 2.54 mm por carácter
const LINE_HEIGHT_KERN = 1.8; // interlineado 1.5 (avance de rodillo ≈ 6.3 mm)

/** Fuente: "Courier Prime" con respaldo de sistema. */
export const FONT_STACK = '"Courier Prime", "Courier New", "Menlo", monospace';

export const FONT_SIZE = Math.round((FONT_SIZE_PT / 72) * DPI);

/** Rejilla fija: columnas y filas determinadas por los márgenes. */
export const COLS = Math.floor(
  (PAGE_W - MARGIN_LEFT - MARGIN_RIGHT) / (FONT_SIZE * CHAR_KERN),
);
export const ROWS = Math.floor(
  (PAGE_H - MARGIN_TOP - MARGIN_BOTTOM) / (FONT_SIZE * LINE_HEIGHT_KERN),
);

export interface Layout {
  charW: number;
  lineH: number;
  x(col: number): number;
  y(row: number): number;
}

export function createLayout(): Layout {
  const charW = FONT_SIZE * CHAR_KERN;
  const lineH = FONT_SIZE * LINE_HEIGHT_KERN;
  return {
    charW,
    lineH,
    x: (col: number) => MARGIN_LEFT + col * charW + charW / 2,
    y: (row: number) => MARGIN_TOP + row * lineH + lineH / 2,
  };
}