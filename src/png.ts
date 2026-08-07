/**
 * Inyección del chunk pHYs en un PNG para que la imagen exportada lleve la
 * resolución física real (p. ej. 1200 DPI), en píxeles por metro.
 */

/** CRC-32 del estándar PNG (polinomio 0xEDB88320). */
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** Inserta el chunk pHYs justo después de IHDR (9 bytes de longitud total). */
function embedPhys(blob: Blob, dpi: number): Promise<Blob> {
  const ppm = Math.round(dpi / 0.0254); // píxeles por metro
  return blob.arrayBuffer().then((buf) => {
    const src = new Uint8Array(buf);
    // Firma PNG (8) + cabecera de chunk (4) + tipo IHDR (4) + datos IHDR (13) + CRC (4).
    const ihdrEnd = 8 + 8 + 13 + 4;
    if (src.length < ihdrEnd + 4) return blob;

    const data = new Uint8Array(9);
    const dv = new DataView(data.buffer);
    dv.setUint32(0, ppm);
    dv.setUint32(4, ppm);
    data[8] = 1; // unidad: metro

    const typeAndData = new Uint8Array(4 + data.length);
    typeAndData.set(new TextEncoder().encode("pHYs"), 0);
    typeAndData.set(data, 4);
    const crc = crc32(typeAndData);

    const chunk = new Uint8Array(4 + 4 + data.length + 4);
    const cview = new DataView(chunk.buffer);
    cview.setUint32(0, data.length);
    chunk.set(typeAndData, 4);
    cview.setUint32(8 + data.length, crc);

    const out = new Uint8Array(src.length + chunk.length);
    out.set(src.subarray(0, ihdrEnd), 0);
    out.set(chunk, ihdrEnd);
    out.set(src.subarray(ihdrEnd), ihdrEnd + chunk.length);
    return new Blob([out.buffer as ArrayBuffer], { type: "image/png" });
  });
}

export function embedDpi(blob: Blob, dpi: number): Promise<Blob> {
  return embedPhys(blob, dpi);
}