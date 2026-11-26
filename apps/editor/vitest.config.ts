import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "e2e-editor-browser",
    include: ["src/**/*.browser.test.ts"],
    globalSetup: [
      "../../packages/tools/src/testing/guard/globalSetup.ts",
      "src/testing/buildEditor.ts",
    ],
    setupFiles: ["../../packages/tools/src/testing/guard/nodeTestGuard.ts"],
    testTimeout: 60_000,
    env: { YUMEKIT_CODEX_PATH: "/tests-start-no-real-codex" },
    hookTimeout: 120_000,
    expect: { poll: { timeout: 20_000 } },
  },
});
