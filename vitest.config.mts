import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/vitest.setup.tsx"],
    include: ["test/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/app/layout.tsx",
        "src/app/**/layout.tsx",
        // Exclude Server Component pages (tested via E2E instead)
        "src/app/**/page.tsx",
        // Exclude MapPickerModal - uses dynamic Leaflet imports and browser APIs
        "src/components/MapPickerModal.tsx",
        // Exclude admin components - complex UI tested via E2E instead
        "src/components/admin/**/*.{ts,tsx}",
        // Exclude media API routes - tested via E2E instead
        "src/app/api/media/**/*.ts",
        // Exclude barrel files (re-exports only) - v8 coverage doesn't handle them well
        "src/**/index.ts",
      ],
      thresholds: {
        statements: 99,
        branches: 97,
        functions: 99,
        lines: 99,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
