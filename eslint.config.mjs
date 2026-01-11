import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    // Build artifacts
    ".open-next/**",
    // Test output
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
  ]),
  // Custom rules
  {
    rules: {
      // <img> is intentionally used for dynamic external images (R2, etc.)
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
