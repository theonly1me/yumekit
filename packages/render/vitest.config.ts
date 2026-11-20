import { playwright } from "@vitest/browser-playwright";
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "render-page-browser",
    include: ["src/page/**/*.browser.test.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
