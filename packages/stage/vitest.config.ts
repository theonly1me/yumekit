import { playwright } from "@vitest/browser-playwright";
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "stage-browser",
    include: ["src/**/*.browser.test.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
