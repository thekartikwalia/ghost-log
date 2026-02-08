import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Single-file build for background (no chunk imports).
// Chrome extension service workers can fail with status 15 when loading ES module chunks.
export default defineConfig({
  root: __dirname,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, "src/background/index.ts"),
      output: {
        entryFileNames: "background.js",
        format: "es",
        inlineDynamicImports: true,
      },
    },
    minify: "esbuild",
    target: "esnext",
    sourcemap: true,
  },
});
