import type { Browser, Page } from "playwright-core";
import type { RenderFailure, RenderScale } from "../renderFailure.js";
import type { SeekResult } from "../page/stagePageData.js";

export interface BrowserStagePage {
  seek: (frame: number) => Promise<SeekResult>;
  screenshot: () => Promise<Uint8Array>;
}

export interface StagePage extends BrowserStagePage {
  videoFramesFailure: () => RenderFailure | undefined;
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
}): Promise<BrowserStagePage> {
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
