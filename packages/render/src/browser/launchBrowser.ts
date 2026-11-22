import { chromium, type Browser } from "playwright-core";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";

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
      hint: "Run: yumekit setup",
    });
  }
}
