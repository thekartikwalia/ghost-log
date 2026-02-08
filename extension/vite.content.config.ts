import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Single-file build for content script (no chunk imports).
export default defineConfig({
  root: __dirname,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, "src/content/index.ts"),
      output: {
        entryFileNames: "content.js",
        format: "es",
        inlineDynamicImports: true,
      },
    },
    minify: "esbuild",
    target: "esnext",
    sourcemap: true,
  },
});
