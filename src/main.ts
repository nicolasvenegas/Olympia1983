import { PAGE_W, PAGE_H, COLS, ROWS } from "./layout";
import { renderPage } from "./render";
import { Typewriter } from "./engine";
import { exportPagePng, renderPagePngBlob } from "./export";
import {
  isDesktop,
  loadSmtpConfig,
  saveSmtpConfig,
  sendPageByEmail,
  type SmtpConfig,
  type MailDraft,
} from "./mail";

const engine = new Typewriter();

const canvas = document.getElementById("page") as HTMLCanvasElement;
canvas.width = PAGE_W;
canvas.height = PAGE_H;
const ctx = canvas.getContext("2d")!;

const pageLabel = document.getElementById("pageLabel") as HTMLElement;
const charCount = document.getElementById("charCount") as HTMLElement;
const lineCount = document.getElementById("lineCount") as HTMLElement;
const exportBtn = document.getElementById("exportBtn") as HTMLButtonElement;
const printBtn = document.getElementById("printBtn") as HTMLButtonElement;
const mailBtn = document.getElementById("mailBtn") as HTMLButtonElement;
const mailDialog = document.getElementById("mailDialog") as HTMLDialogElement;
const mailForm = document.getElementById("mailForm") as HTMLFormElement;
const mailStatus = document.getElementById("mailStatus") as HTMLElement;
const mailSendBtn = document.getElementById("mailSendBtn") as HTMLButtonElement;
const mailCloseBtn = document.getElementById("mailCloseBtn") as HTMLButtonElement;
const mailTo = document.getElementById("mailTo") as HTMLInputElement;
const mailSubject = document.getElementById("mailSubject") as HTMLInputElement;
const mailBody = document.getElementById("mailBody") as HTMLTextAreaElement;
const smtpHost = document.getElementById("smtpHost") as HTMLInputElement;
const smtpPort = document.getElementById("smtpPort") as HTMLInputElement;
const smtpTls = document.getElementById("smtpTls") as HTMLSelectElement;
const smtpUsername = document.getElementById("smtpUsername") as HTMLInputElement;
const smtpPassword = document.getElementById("smtpPassword") as HTMLInputElement;
const smtpFrom = document.getElementById("smtpFrom") as HTMLInputElement;

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
  charCount.textContent = `columna: ${engine.cursor.col}/${COLS} · quedan ${remaining}`;
}

/** Línea actual del carro (1-based) sobre el total de la hoja. */
function updateLineCount(): void {
  lineCount.textContent = `línea: ${engine.cursor.row + 1}/${ROWS}`;
}

/** Redibuja la hoja y actualiza los contadores tras cada acción. */
function react(_action: import("./engine").Action): void {
  draw();
  updateCharCount();
  updateLineCount();
}

/** Abre una ventana con la hoja a 300 DPI y la envía a la impresora. */
function printCurrentPage(): void {
  if (document.body.classList.contains("exporting")) return;
  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return;
  document.body.classList.add("exporting");
  renderPagePngBlob(engine.glyphs, engine.cursor)
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      win.document.write(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Olympia1983 — Imprimir</title>
<style>
  @page { size: Letter; margin: 0; }
  html, body { margin: 0; padding: 0; }
  img { display: block; width: 8.5in; height: 11in; }
</style>
</head>
<body><img id="printImage" src="${url}"></body>
</html>`);
      win.document.close();
      const img = win.document.getElementById("printImage") as HTMLImageElement;
      img.onload = () => {
        win.focus();
        win.print();
      };
      win.onafterprint = () => {
        URL.revokeObjectURL(url);
        win.close();
      };
    })
    .catch((err) => {
      console.error("Fallo al imprimir:", err);
      win.close();
    })
    .finally(() => document.body.classList.remove("exporting"));
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
  updateLineCount();
}

const DESTRUCTIVE_MOD = new Set(["backspace", "delete", "z", "x", "v", "a", "y"]);

function isFormField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const t = target.tagName;
  return t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || t === "BUTTON";
}

function onKeyDown(e: KeyboardEvent): void {
  // Con el diálogo de correo abierto, la escritura va a sus campos.
  if (mailDialog.open || isFormField(e.target)) return;

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
    case "F3":
      e.preventDefault();
      printCurrentPage();
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
printBtn.addEventListener("click", printCurrentPage);
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

/** Rellena el formulario con la configuración guardada y el state actual. */
function fillMailForm(): void {
  const smtp = loadSmtpConfig();
  smtpHost.value = smtp.host ?? "";
  smtpPort.value = smtp.port ? String(smtp.port) : "587";
  smtpTls.value = smtp.tls ?? "starttls";
  smtpUsername.value = smtp.username ?? "";
  smtpPassword.value = smtp.password ?? "";
  smtpFrom.value = smtp.from ?? smtpUsername.value;
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  mailSubject.value = `Hoja Olympia1983 ${dd}${mm}${yyyy}_${hh}${mi}`;
  mailBody.value = `Hoja escrita con Olympia1983 (emulador de la Olympia AEG Carrera MD). PNG adjunto a 300 DPI.`;
}

function readSmtpForm(): SmtpConfig {
  return {
    host: smtpHost.value.trim(),
    port: Number(smtpPort.value) || 587,
    tls: smtpTls.value as SmtpConfig["tls"],
    username: smtpUsername.value.trim(),
    password: smtpPassword.value.trim(),
    from: smtpFrom.value.trim(),
  };
}

function openMailDialog(): void {
  fillMailForm();
  mailStatus.textContent = "";
  mailSendBtn.disabled = false;
  mailDialog.showModal();
}

if (isDesktop()) {
  mailBtn.hidden = false;
  mailBtn.addEventListener("click", openMailDialog);
} else {
  // En la web el envío no está disponible; el botón permanece oculto.
  mailBtn.hidden = true;
}

mailCloseBtn.addEventListener("click", () => mailDialog.close());

mailForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const config = readSmtpForm();
  if (!config.host || !config.from || !mailTo.value.trim()) {
    mailStatus.textContent = "Completa destinatario, servidor y remitente.";
    return;
  }
  saveSmtpConfig(config);
  const draft: MailDraft = {
    to: mailTo.value.trim(),
    subject: mailSubject.value.trim(),
    body: mailBody.value.trim(),
  };
  mailSendBtn.disabled = true;
  mailStatus.textContent = "Enviando…";
  void sendPageByEmail(engine.glyphs, engine.cursor, config, draft)
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      mailStatus.textContent = `Error: ${msg}`;
    })
    .finally(() => {
      if (!mailStatus.textContent.startsWith("Error")) {
        mailDialog.close();
        engine.newPage();
        engine.pageCounter += 1;
        updateLabel();
        updateCharCount();
        updateLineCount();
        draw();
      } else {
        mailSendBtn.disabled = false;
      }
    });
});

updateLabel();
updateCharCount();
updateLineCount();
draw();
requestAnimationFrame(blink);