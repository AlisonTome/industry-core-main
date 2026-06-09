import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  base: "./",  // ✅ caminhos relativos — funciona em qualquer ambiente
    server: {
      host: "127.0.0.1",  // ← era "::"  (IPv6), troque para IPv4
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
}));