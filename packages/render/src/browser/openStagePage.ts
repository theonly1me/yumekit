import type { Browser, Page } from "playwright-core";
import type { RenderScale } from "../renderFailure.js";
import type { SeekResult } from "../page/stagePageData.js";

export interface StagePage {
  seek: (frame: number) => Promise<SeekResult>;
  screenshot: () => Promise<Uint8Array>;
}

const pageReadyMilliseconds = 60_000;

async function waitForStage(page: Page): Promise<void> {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  try {
    await page.waitForFunction(() => window.yumekitStage !== undefined, null, {
      timeout: pageReadyMilliseconds,
    });
  } catch (error) {
    throw new Error(
      `The stage page did not start: ${pageErrors.map((pageError) => pageError.message).join("; ")}`,
      { cause: error },
    );
  }
}

export async function openStagePage(options: {
  browser: Browser;
  pageUrl: string;
  origin: string;
  output: { widthPixels: number; heightPixels: number };
  scale: RenderScale;
}): Promise<StagePage> {
  const { browser, origin, output, scale } = options;
  const context = await browser.newContext({
    viewport: { width: output.widthPixels, height: output.heightPixels },
    deviceScaleFactor: scale,
    serviceWorkers: "block",
  });
  await context.route(
    (url) => url.origin !== origin || url.pathname.startsWith("/@vite/"),
    (route) => route.abort("blockedbyclient"),
  );
  const page = await context.newPage();
  await page.goto(options.pageUrl);
  await waitForStage(page);
  return {
    seek: (frame) =>
      page.evaluate(async (stageFrame) => {
        const stage = window.yumekitStage;
        if (stage === undefined) {
          throw new Error("The stage page is not ready");
        }
        return stage.seek(stageFrame);
      }, frame),
    screenshot: () => page.screenshot({ type: "png", caret: "initial" }),
  };
}
