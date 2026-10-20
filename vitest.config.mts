import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws outside a React Server build; in unit tests it's a no-op.
    alias: { "server-only": new URL("./tests/server-only-stub.ts", import.meta.url).pathname },
  },
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
