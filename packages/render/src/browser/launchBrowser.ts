import { createRequire } from "node:module";
import { chromium, type Browser } from "playwright-core";
import { z } from "zod";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";

const playwrightVersion = z
  .object({ version: z.string() })
  .parse(
    createRequire(import.meta.url)("playwright-core/package.json"),
  ).version;

function isMissingBrowser(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes("Executable doesn't exist")
  );
}

export async function launchBrowser(): Promise<
  Outcome<Browser, RenderFailure>
> {
  try {
    return succeed(
      await chromium.launch({
        headless: true,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
        args: ["--force-color-profile=srgb", "--hide-scrollbars"],
      }),
    );
  } catch (error) {
    if (!isMissingBrowser(error)) {
      throw error;
    }
    return fail({
      kind: "browser-not-installed",
      message: "Chromium for Playwright is not installed.",
      hint: `Run: npx playwright@${playwrightVersion} install chromium`,
    });
  }
}
