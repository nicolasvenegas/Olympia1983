import { COLS, ROWS } from "./layout";

/** Un carácter impreso. La lista es append-only: nunca se elimina. */
export interface Glyph {
  id: number;
  char: string;
  row: number;
  col: number;
  /** Desplazamiento vertical de media línea al imprimirse: -1, 0 o 1. */
  half: -1 | 0 | 1;
  timestamp: number;
}

export interface Cursor {
  row: number;
  col: number; // puede valer COLS: carro en el margen derecho
  /** Posición vertical de media línea respecto a la fila: -1 (↑), 0, 1 (↓). */
  half: -1 | 0 | 1;
}

export type Action =
  | { kind: "typed" } // glifo impreso, carro avanzado
  | { kind: "newline" } // Enter: salto de línea + retorno a col 0
  | { kind: "moved" } // flecha: desplazamiento del carro
  | { kind: "bell" } // se entra/activa la zona de fin de página
  | { kind: "blocked" }; // acción prohibida o fuera de límites

/** Motores de la máquina: no conoce DOM ni audio; sólo reglas de escritura. */
export class Typewriter {
  readonly glyphs: Glyph[] = [];
  cursor: Cursor = { row: 0, col: 0, half: 0 };
  /** Numeración de páginas exportadas. */
  pageCounter = 1;
  private nextGlyphId = 1;

  /** Imprime un carácter en la celda actual y avanza el carro. */
  type(char: string): Action {
    if (char.length !== 1) return { kind: "blocked" };
    // Carro ya en el margen derecho: no se imprime nada más.
    if (this.cursor.col >= COLS) {
      return { kind: "blocked" };
    }
    this.glyphs.push({
      id: this.nextGlyphId++,
      char,
      row: this.cursor.row,
      col: this.cursor.col,
      half: this.cursor.half,
      timestamp: Date.now(),
    });
    this.cursor.col += 1;
    // Al alcanzar el margen derecho se dispara la campana.
    if (this.cursor.col === COLS) return { kind: "bell" };
    return { kind: "typed" };
  }

  /** Salto de línea + retorno al margen izquierdo. Bloqueado en la última línea. */
  newline(): Action {
    if (this.cursor.row >= ROWS - 1) return { kind: "blocked" };
    this.cursor.row += 1;
    this.cursor.col = 0;
    this.cursor.half = 0;
    return { kind: "newline" };
  }

  /** Mueve el carro una columna atrás (mínimo 0). Nunca borra. */
  moveLeft(): Action {
    if (this.cursor.col <= 0) return { kind: "blocked" };
    this.cursor.col -= 1;
    return { kind: "moved" };
  }

  /** Mueve el carro una columna adelante (máximo el margen derecho). */
  moveRight(): Action {
    if (this.cursor.col >= COLS) return { kind: "blocked" };
    this.cursor.col += 1;
    return { kind: "moved" };
  }

  /** Cambia de línea conservando la columna. */
  moveUp(): Action {
    if (this.cursor.row <= 0) return { kind: "blocked" };
    this.cursor.row -= 1;
    this.cursor.half = 0;
    return { kind: "moved" };
  }

  moveDown(): Action {
    if (this.cursor.row >= ROWS - 1) return { kind: "blocked" };
    this.cursor.row += 1;
    this.cursor.half = 0;
    return { kind: "moved" };
  }

  /**
   * Salto de media línea hacia arriba (Shift+↑): sobreíndice.
   * No puede salirse del alto de la página.
   */
  halfLineUp(): Action {
    if (this.cursor.row === 0 && this.cursor.half === -1) return { kind: "blocked" };
    this.cursor.half = Math.max(this.cursor.half - 1, -1) as Cursor["half"];
    return { kind: "moved" };
  }

  /** Salto de media línea hacia abajo (Shift+↓): subíndice. */
  halfLineDown(): Action {
    if (this.cursor.row === ROWS - 1 && this.cursor.half === 1) return { kind: "blocked" };
    this.cursor.half = Math.min(this.cursor.half + 1, 1) as Cursor["half"];
    return { kind: "moved" };
  }

  /** Hoja nueva tras exportar: se limpia la página actual. */
  newPage(): void {
    this.glyphs.length = 0;
    this.cursor = { row: 0, col: 0, half: 0 };
  }

  nextPageNumber(): string {
    return String(this.pageCounter).padStart(3, "0");
  }
}