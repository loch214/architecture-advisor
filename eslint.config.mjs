import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  prettier,
  {
    // Fitness function: the engine and the data it reads stay pure (no clock, randomness, network or browser state).
    files: ["src/modules/scoring/**", "src/modules/knowledge-base/**", "src/modules/recommendation/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...[
          "fetch",
          "Date",
          "window",
          "document",
          "localStorage",
          "sessionStorage",
          "setTimeout",
          "setInterval",
          "crypto",
          "process",
        ].map((name) => ({
          name,
          message: "Pure modules must not use the clock, randomness, network or runtime state.",
        })),
      ],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: "Pure modules must be deterministic." },
      ],
    },
  },
]);

export default eslintConfig;
