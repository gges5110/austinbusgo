import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";
import { join, parse, resolve } from "path";

export default defineConfig(() => {
  return {
    base: "/",
    build: {
      outDir: "build",
      rollupOptions: {
        input: entryPoints("index.html", "404.html"),
      },
    },
    plugins: [react(), eslint()],
    appType: "spa",
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
    },
  };
});

function entryPoints(...paths) {
  const entries = paths.map(parse).map((entry) => {
    const { dir, base, name } = entry;
    const key = join(dir, name);
    // eslint-disable-next-line no-undef
    const path = resolve(__dirname, dir, base);
    return [key, path];
  });

  const config = Object.fromEntries(entries);
  return config;
}
