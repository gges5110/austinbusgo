import { join, parse, resolve } from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    base: process.env.VITE_BASE || "/",
    build: {
      outDir: "build",
      rollupOptions: {
        input: entryPoints("index.html", "404.html"),
      },
    },
    plugins: [react()],
    appType: "spa",
    resolve: {
      alias: {
        app: resolve(__dirname, "src/app"),
        features: resolve(__dirname, "src/features"),
        shared: resolve(__dirname, "src/shared"),
        pages: resolve(__dirname, "src/pages"),
        config: resolve(__dirname, "src/config"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      include: ["src/**/*.test.{ts,tsx}"],
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
