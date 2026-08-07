import { PAGE_W, PAGE_H, COLS } from "./layout";
import { renderPage } from "./render";
import { Typewriter } from "./engine";
import { exportPagePng } from "./export";

const engine = new Typewriter();

const canvas = document.getElementById("page") as HTMLCanvasElement;
canvas.width = PAGE_W;
canvas.height = PAGE_H;
const ctx = canvas.getContext("2d")!;

const pageLabel = document.getElementById("pageLabel") as HTMLElement;
const charCount = document.getElementById("charCount") as HTMLElement;
const exportBtn = document.getElementById("exportBtn") as HTMLButtonElement;

let caretVisible = true;

function draw(): void {
  renderPage(ctx, engine.glyphs, engine.cursor, {
    showCursor: true,
    final: false,
  });
}

function updateLabel(): void {
  pageLabel.textContent = `página ${engine.nextPageNumber()}`;
}

/** Caracteres usados / disponibles y cuántos quedan en la línea actual. */
function updateCharCount(): void {
  const remaining = Math.max(COLS - engine.cursor.col, 0);
  charCount.textContent = `línea: ${engine.cursor.col}/${COLS} · quedan ${remaining}`;
}

/** Redibuja la hoja y actualiza el contador tras cada acción. */
function react(_action: import("./engine").Action): void {
  draw();
  updateCharCount();
}

/** Exporta el PNG, limpia la página y deja una hoja nueva en blanco. */
async function exportAndNewPage(): Promise<void> {
  if (document.body.classList.contains("exporting")) return;
  document.body.classList.add("exporting");
  try {
    await exportPagePng(engine.glyphs, engine.cursor);
    engine.newPage();
    engine.pageCounter += 1;
    updateLabel();
  } catch (err) {
    console.error("Fallo al exportar:", err);
  } finally {
    document.body.classList.remove("exporting");
  }
  draw();
  updateCharCount();
}

const DESTRUCTIVE_MOD = new Set(["backspace", "delete", "z", "x", "v", "a", "y"]);

function onKeyDown(e: KeyboardEvent): void {
  // Bloquea cortar/pegar/borrar/deshacer/seleccionar con modificador.
  if (e.ctrlKey || e.metaKey) {
    const k = e.key.toLowerCase();
    if (DESTRUCTIVE_MOD.has(k)) {
      e.preventDefault();
      react({ kind: "blocked" });
    }
    return;
  }

  switch (e.key) {
    case "F2":
      e.preventDefault();
      void exportAndNewPage();
      return;
    case "Backspace":
    case "Delete":
      // No existe borrado: tecla bloqueada.
      e.preventDefault();
      react({ kind: "blocked" });
      return;
    case "Tab":
      e.preventDefault();
      react({ kind: "blocked" });
      return;
    case "ArrowLeft":
      e.preventDefault();
      react(engine.moveLeft());
      return;
    case "ArrowRight":
      e.preventDefault();
      react(engine.moveRight());
      return;
    case "ArrowUp":
      e.preventDefault();
      react(e.shiftKey ? engine.halfLineUp() : engine.moveUp());
      return;
    case "ArrowDown":
      e.preventDefault();
      react(e.shiftKey ? engine.halfLineDown() : engine.moveDown());
      return;
    case "Enter":
      e.preventDefault();
      react(engine.newline());
      return;
    default:
      // Un único carácter imprimible se estampa y avanza el carro.
      if (e.key.length === 1) {
        e.preventDefault();
        react(engine.type(e.key));
      }
  }
}

let lastBlink = performance.now();
function blink(t: number): void {
  if (t - lastBlink >= 560) {
    caretVisible = !caretVisible;
    lastBlink = t;
    draw();
  }
  requestAnimationFrame(blink);
}

window.addEventListener("keydown", onKeyDown, { capture: true });
exportBtn.addEventListener("click", () => void exportAndNewPage());
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

updateLabel();
updateCharCount();
draw();
requestAnimationFrame(blink);