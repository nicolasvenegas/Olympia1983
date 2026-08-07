import {
  DPI,
  PAGE_W,
  PAGE_H,
  FONT_STACK,
  FONT_SIZE,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  MARGIN_TOP,
  MARGIN_BOTTOM,
  createLayout,
  type Layout,
} from "./layout";
import type { Glyph, Cursor } from "./engine";

export const INK = "#000000";
/** Grosor del carro, proporcional al DPI (equivalente a 7 px a 300 dpi). */
const LINE_CAP = Math.round((7 / 300) * DPI);

export interface RenderOptions {
  showCursor: boolean;
  /** True durante la exportación: pinta sin cursor ni marcadores. */
  final: boolean;
}

/**
 * Dibuja el estado completo de la hoja en un canvas 2D de resolución real
 * (2480 × 3508, 300 DPI). `ctx` debe corresponder a un canvas con esas
 * dimensiones reales (atributos, no CSS).
 */
export function renderPage(
  ctx: CanvasRenderingContext2D,
  glyphs: Glyph[],
  cursor: Cursor,
  opts: RenderOptions,
  layout: Layout = createLayout(),
): void {
  // Papel.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  ctx.font = `${FONT_SIZE}px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;

  // Impresiones (append-only, en orden; la sobreimpresión queda encima).
  for (const g of glyphs) {
    ctx.fillText(g.char, layout.x(g.col), layout.y(g.row) + g.half * (layout.lineH / 2));
  }

  if (opts.showCursor) drawCursor(ctx, cursor, layout);
}

/** Cursor tipo carro con destello: una barra vertical contundente. */
function drawCursor(ctx: CanvasRenderingContext2D, cursor: Cursor, layout: Layout): void {
  const baseY = layout.y(cursor.row) + cursor.half * (layout.lineH / 2);
  const x = MARGIN_LEFT + cursor.col * layout.charW - LINE_CAP / 2;
  const top = baseY - layout.lineH * 0.42;
  const bottom = baseY + layout.lineH * 0.42;

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = INK;
  ctx.fillRect(x, top, LINE_CAP, bottom - top);
  // Punto de impresión: subrayado triple sutil.
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x - 6, bottom - 2, layout.charW + 12, 3);
  ctx.restore();
}