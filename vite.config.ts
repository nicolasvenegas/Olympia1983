import { defineConfig } from "vite";

export default defineConfig({
  // Base relativa: el mismo build funciona en GitHub Pages (bajo /Olympia1983/)
  // y en el shell de escritorio Tauri, que sirve los recursos desde la raíz.
  base: "./",
  build: {
    outDir: "dist",
  },
});
