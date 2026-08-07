import { invoke, isTauri } from "@tauri-apps/api/core";
import { renderPagePngBlob } from "./export";
import type { Glyph, Cursor } from "./engine";

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  tls: "starttls" | "implicit" | "none";
}

export interface MailDraft {
  to: string;
  subject: string;
  body: string;
}

const SMTP_STORAGE_KEY = "olympiamd.smtp";

/** Devuelve true cuando la app corre dentro del shell Tauri de escritorio. */
export function isDesktop(): boolean {
  return isTauri();
}

/** Lee la configuración SMTP guardada (o vacía). */
export function loadSmtpConfig(): Partial<SmtpConfig> {
  try {
    const raw = localStorage.getItem(SMTP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SmtpConfig>) : {};
  } catch {
    return {};
  }
}

/** Persiste la configuración SMTP del usuario. */
export function saveSmtpConfig(config: SmtpConfig): void {
  localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(config));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result ?? "").split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el PNG."));
    reader.readAsDataURL(blob);
  });
}

/** Renderiza la hoja a 300 DPI, la adjunta y la envía por SMTP vía Rust. */
export async function sendPageByEmail(
  glyphs: Glyph[],
  cursor: Cursor,
  config: SmtpConfig,
  draft: MailDraft,
): Promise<void> {
  const blob = await renderPagePngBlob(glyphs, cursor);
  const base64 = await blobToBase64(blob);
  const stamp = new Date();
  const dd = String(stamp.getDate()).padStart(2, "0");
  const mm = String(stamp.getMonth() + 1).padStart(2, "0");
  const yyyy = String(stamp.getFullYear());
  const hh = String(stamp.getHours()).padStart(2, "0");
  const mi = String(stamp.getMinutes()).padStart(2, "0");
  const filename = `${dd}${mm}${yyyy}_${hh}${mi}.png`;

  await invoke("send_email", {
    config,
    draft: {
      ...draft,
      attachmentName: filename,
      attachmentBase64: base64,
    },
  });
}