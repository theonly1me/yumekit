import { defineConfig } from "vitest/config";

const nodeTestSettings = {
  env: { YUMEKIT_CODEX_PATH: "/tests-start-no-real-codex" },
  globalSetup: ["packages/tools/src/testing/guard/globalSetup.ts"],
  testTimeout: 30_000,
};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          ...nodeTestSettings,
          name: "unit-node",
          include: [
            "{packages,apps,tools}/*/src/**/*.test.{ts,tsx}",
            "scripts/**/*.test.ts",
          ],
          exclude: [
            "**/node_modules/**",
            "**/*.browser.test.{ts,tsx}",
            "**/*.e2e.test.{ts,tsx}",
          ],
          setupFiles: [
            "packages/tools/src/testing/guard/nodeTestGuard.ts",
            "packages/tools/src/testing/guard/unitTestGuard.ts",
          ],
        },
      },
      {
        test: {
          ...nodeTestSettings,
          name: "e2e-node",
          include: [
            "{packages,apps,tools}/*/src/**/*.e2e.test.{ts,tsx}",
            "scripts/**/*.e2e.test.ts",
          ],
          exclude: ["**/node_modules/**"],
          hookTimeout: 30_000,
          setupFiles: ["packages/tools/src/testing/guard/nodeTestGuard.ts"],
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
