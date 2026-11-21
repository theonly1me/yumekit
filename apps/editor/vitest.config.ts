import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "editor-browser",
    include: ["src/**/*.browser.test.ts"],
    globalSetup: ["src/testing/buildEditor.ts"],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    expect: { poll: { timeout: 20_000 } },
  },
});
