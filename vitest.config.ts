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
        },
      },
      "packages/scene/vitest.config.ts",
      "packages/stage/vitest.config.ts",
      "packages/render/vitest.config.ts",
    ],
  },
});
