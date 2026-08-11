/**
 * Configuración geométrica de la hoja Carta (US Letter) y de la rejilla
 * monoespaciada fija de la máquina de escribir.
 *
 * Toda medida de pixel se deriva del DPI, de modo que el tamaño físico de
 * los caracteres se mantiene constante y es idéntico entre edición y salida.
 *
 * La EDICIÓN se hace sobre un lienzo ligero (150 DPI) y la EXPORTACIÓN se
 * genera en resolución completa (300 DPI) escalando el mismo render vectorial.
 *
 * Carta = 8.5 in × 11 in.
 */
export const DPI = 150; // resolución del lienzo de edición (ligero)
export const EXPORT_DPI = 300; // resolución del PNG exportado

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
 *  - CHAR_KERN (avance visual del glifo): espaciado entre caracteres. El paso
 *    mecánico de Pica (0.72) dejaba aire de más porque el avance real de
 *    Courier Prime es ≈ 0.6em; 0.585 lo acerca aún más: el bloque de texto
 *    resulta ~10% más estrecho que con 0.65 y se centra en la hoja.
 *  - PITCH_KERN (paso de columna para la rejilla): pitch Pica = 10 cpi →
 *    7.2 pt por columna sobre un cuerpo de 10 pt ⇒ 0.72. Determina COLS y no
 *    depende del espaciado visual: las columnas por línea no cambian.
 *  - LINE_HEIGHT_KERN (interlineado): selector compacto ⇒ 15 pt de alto de
 *    línea sobre un cuerpo de 10 pt ⇒ 1.5 (más apretado que el original 1.8).
 */
const CHAR_KERN = 0.585; // avance visual de cada glifo (espaciado entre caracteres)
const PITCH_KERN = 0.72; // paso mecánico de columna: 10 cpi (Pica), 2.54 mm
const LINE_HEIGHT_KERN = 1.5; // alto de línea compacto (15 pt)

/** Fuente: "Courier Prime" con respaldo de sistema. */
export const FONT_STACK = '"Courier Prime", "Courier New", "Menlo", monospace';

export const FONT_SIZE = Math.round((FONT_SIZE_PT / 72) * DPI);

/** Rejilla fija: las columnas dependen del paso mecánico (PITCH_KERN), no del
 * espaciado visual (CHAR_KERN); cambiar el espaciado no reduce las columnas. */
export const COLS = Math.floor(
  (PAGE_W - MARGIN_LEFT - MARGIN_RIGHT) / (FONT_SIZE * PITCH_KERN),
);
export const ROWS = Math.floor(
  (PAGE_H - MARGIN_TOP - MARGIN_BOTTOM) / (FONT_SIZE * LINE_HEIGHT_KERN),
);

export interface Layout {
  charW: number;
  lineH: number;
  /** Origen horizontal del bloque de texto (centrado en la hoja). */
  left: number;
  x(col: number): number;
  y(row: number): number;
}

export function createLayout(): Layout {
  const charW = FONT_SIZE * CHAR_KERN;
  const lineH = FONT_SIZE * LINE_HEIGHT_KERN;
  const left = (PAGE_W - COLS * charW) / 2;
  return {
    charW,
    lineH,
    left,
    x: (col: number) => left + col * charW + charW / 2,
    y: (row: number) => MARGIN_TOP + row * lineH + lineH / 2,
  };
}