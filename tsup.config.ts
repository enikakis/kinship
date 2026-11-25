import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    svg: "src/svg.ts",
    gedcom: "src/gedcom.ts",
    "locales/el": "src/locales/el.ts",
    "locales/en": "src/locales/en.ts",
    "locales/fr": "src/locales/fr.ts",
    "locales/de": "src/locales/de.ts",
    "locales/es": "src/locales/es.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  target: "es2022",
  platform: "neutral",
  splitting: true,
  treeshake: true,
  sourcemap: false,
  minify: false,
  clean: true,
  outDir: "dist",
});
