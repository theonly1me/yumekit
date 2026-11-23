import type { Browser, Page } from "playwright-core";
import type { RenderFailure, RenderScale } from "../renderFailure.js";
import type { SeekResult, StagePageLoad } from "../page/stagePageData.js";

export type PictureUse = "still" | "video";

export interface BrowserStagePage {
  load: (pageLoad: StagePageLoad) => Promise<void>;
  seek: (frame: number) => Promise<SeekResult>;
  screenshot: (use: PictureUse) => Promise<Uint8Array>;
  close: () => Promise<void>;
}

export interface StagePage extends Omit<BrowserStagePage, "load" | "close"> {
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
  const protocol = await context.newCDPSession(page);
  return {
    load: (pageLoad) =>
      page.evaluate(async (stageLoad) => {
        const stage = window.yumekitStage;
        if (stage === undefined) {
          throw new Error("The stage page is not ready");
        }
        await stage.load(stageLoad);
      }, JSON.stringify(pageLoad)),
    seek: (frame) =>
      page.evaluate(async (stageFrame) => {
        const stage = window.yumekitStage;
        if (stage === undefined) {
          throw new Error("The stage page is not ready");
        }
        return stage.seek(stageFrame);
      }, frame),
    screenshot: async (use) => {
      if (use === "still") {
        return page.screenshot({ type: "png", caret: "initial" });
      }
      const captured = await protocol.send("Page.captureScreenshot", {
        format: "png",
        optimizeForSpeed: true,
        clip: {
          x: 0,
          y: 0,
          width: output.widthPixels,
          height: output.heightPixels,
          scale,
        },
        captureBeyondViewport: false,
      });
      return Buffer.from(captured.data, "base64");
    },
    close: () => context.close(),
  };
}
