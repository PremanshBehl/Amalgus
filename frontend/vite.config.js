import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Avoid hard-failing when 5173 is already taken.
    // Vite will pick the next available port instead.
    strictPort: false,
  },
});

