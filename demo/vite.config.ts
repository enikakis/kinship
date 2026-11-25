import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const src = (file: string) => fileURLToPath(new URL(`../src/${file}`, import.meta.url));

// The demo imports the library by its package name, served from the source in ../src.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "/kinship/",
  resolve: {
    alias: [
      { find: /^@enikakis99\/kinship$/, replacement: src("index.ts") },
      { find: /^@enikakis99\/kinship\/(svg|gedcom)$/, replacement: src("$1.ts") },
      { find: /^@enikakis99\/kinship\/locales\/(el|en|fr|de|es)$/, replacement: src("locales/$1.ts") },
    ],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
