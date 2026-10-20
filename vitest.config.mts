import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/modules/**/*.ts"],
      exclude: ["src/modules/**/data/**", "src/modules/platform/**"],
      thresholds: {
        "src/modules/scoring/**": { lines: 95, branches: 90, functions: 95, statements: 95 },
        lines: 80,
      },
    },
  },
});
