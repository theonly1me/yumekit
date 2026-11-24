import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          include: [
            "{packages,apps,tools}/*/src/**/*.test.{ts,tsx}",
            "scripts/**/*.test.ts",
          ],
          exclude: ["**/node_modules/**", "**/*.browser.test.{ts,tsx}"],
          testTimeout: 30_000,
          env: { YUMEKIT_CODEX_PATH: "/tests-start-no-real-codex" },
        },
      },
      "packages/scene/vitest.config.ts",
      "packages/scene-kit/vitest.config.ts",
      "packages/stage/vitest.config.ts",
      "packages/render/vitest.config.ts",
      "apps/editor/vitest.config.ts",
    ],
  },
});
