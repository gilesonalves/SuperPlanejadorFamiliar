import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const utf8HeadersPlugin = {
  name: "utf8-headers",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if ((req.headers.accept ?? "").includes("text/html")) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if ((req.headers.accept ?? "").includes("text/html")) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      }
      next();
    });
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), utf8HeadersPlugin, mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
