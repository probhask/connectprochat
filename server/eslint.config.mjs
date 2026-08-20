import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

/**
 * Server ESLint config — mirrors lankwai-backend's flat config (no-console / no-explicit-any
 * as hard errors), see revamp plan Section C.1. `logger.ts` is the one file allowed to call
 * console.* directly; everything else must go through it.
 */
export default [
  {
    ignores: ["dist/**", "node_modules/**", "*.js", "*.mjs"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parser: typescriptParser,
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error",
    },
  },
  {
    files: ["src/lib/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
