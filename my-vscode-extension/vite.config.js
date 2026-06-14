const { defineConfig } = require("vite");
const vue = require("@vitejs/plugin-vue");
const path = require("node:path");

module.exports = defineConfig({
  root: path.resolve(__dirname, "webview-ui"),
  base: "./",
  plugins: [vue()],
  build: {
    outDir: path.resolve(__dirname, "webview-dist"),
    emptyOutDir: true
  }
});
