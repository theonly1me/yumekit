import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/dist/",
    "**/.tsbuild/",
    "**/coverage/",
    "release/",
    "examples/*/scenes/",
  ]),
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.js", "*.ts", "packages/*/vitest.config.ts"],
          defaultProject: "tsconfig.base.json",
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
      "max-lines": ["error", { max: 200 }],
      "max-params": ["error", { max: 1 }],
    },
  },
  {
    files: [
      "apps/editor/**/*.{ts,tsx}",
      "packages/scene/src/**/*.{ts,tsx}",
      "packages/scene-kit/src/**/*.{ts,tsx}",
    ],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["apps/prototype/**/*.js"],
    ignores: ["apps/prototype/middleware.js", "apps/prototype/scripts/**"],
    languageOptions: { globals: globals.browser },
  },
  prettier,
);
