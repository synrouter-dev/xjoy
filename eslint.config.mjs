import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

const eslintConfig = tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
  {
    name: "xjoy",
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommended],
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  }
);

export default eslintConfig;
