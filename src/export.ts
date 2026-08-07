import { PAGE_W, PAGE_H, DPI, EXPORT_DPI } from "./layout";
import { renderPage } from "./render";
import { embedDpi } from "./png";
import type { Glyph, Cursor } from "./engine";

/** Marca de fecha DDMMYYYY, p. ej. 31122026. */
function dateStamp(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${day}${month}${year}`;
}

/** Marca de tiempo HHMM (24h), p. ej. 2159. */
function timeStamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}${mm}`;
}

/**
 * Renderiza la hoja actual a resolución de exportación y devuelve el PNG como
 * Blob con la resolución física incrustada (300 DPI). No descarga nada.
 */
export function renderPagePngBlob(
  glyphs: Glyph[],
  cursor: Cursor,
): Promise<Blob> {
  const scale = EXPORT_DPI / DPI;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(PAGE_W * scale);
  canvas.height = Math.round(PAGE_H * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Render sin cursor ni marcadores, sobre resolución completa.
  renderPage(ctx, glyphs, cursor, { showCursor: false, final: true });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo generar el PNG."));
          return;
        }
        // Incrusta la resolución física (300 DPI) en el PNG.
        embedDpi(blob, EXPORT_DPI).then(resolve, reject);
      },
      "image/png",
      undefined,
    );
  });
}

/**
 * Exporta la hoja actual como PNG a 300 DPI (2550 × 3300 px) y lo descarga.
 * El nombre es: <fecha DDMMYYYY>_<marca de tiempo HHMM>.png (p. ej. 31122026_2159.png).
 */
export function exportPagePng(
  glyphs: Glyph[],
  cursor: Cursor,
): Promise<string> {
  const filename = `${dateStamp()}_${timeStamp()}.png`;
  return renderPagePngBlob(glyphs, cursor).then((dpiBlob) => {
    const url = URL.createObjectURL(dpiBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return filename;
  });
}