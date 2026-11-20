import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          include: ["{packages,apps}/*/src/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/*.browser.test.tsx"],
        },
      },
      "packages/scene/vitest.config.ts",
    ],
  },
});
