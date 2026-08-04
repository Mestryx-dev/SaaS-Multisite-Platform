import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  server: {
    // Dedicated port — 5173 is often occupied by other Vite scaffolds / browser cache
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3001",
      "/v1": "http://localhost:3001",
    },
  },
});
