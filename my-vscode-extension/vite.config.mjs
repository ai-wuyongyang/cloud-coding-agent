import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  root: "./webview-ui",
  plugins: [vue()],
  base: "./",
  build: {
    outDir: "../webview-dist",
    emptyOutDir: true
  }
});
