import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// "/api" calls are forwarded to the Spring Boot backend during development.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8080" } },
});
