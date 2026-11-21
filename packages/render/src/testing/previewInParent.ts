import { setTimeout as delay } from "node:timers/promises";
import type { Browser, Frame, Page } from "playwright-core";
import { launchBrowser } from "../browser/launchBrowser.js";
import { parentPageHtml, startParentServer } from "./parentServer.js";
import { valueOf } from "./valueOf.js";

export type Reply = Record<string, unknown> & {
  type: unknown;
  requestId: unknown;
};

export interface PreviewInParent {
  replies: Reply[];
  send: (message: unknown) => Promise<void>;
  sendFromOtherOrigin: (message: unknown) => Promise<void>;
  waitForReply: (matches: (reply: Reply) => boolean) => Promise<Reply>;
  screenshot: () => Promise<Uint8Array>;
  previewFrame: () => Frame;
  close: () => Promise<void>;
}

const replyWaitMilliseconds = 30_000;

function replyOf(data: unknown): Reply {
  const fields: Record<string, unknown> =
    typeof data === "object" && data !== null
      ? Object.fromEntries(Object.entries(data))
      : {};
  return { ...fields, type: fields["type"], requestId: fields["requestId"] };
}

function frameOf(options: { page: Page; pathname: string }): Frame {
  const found = options.page
    .frames()
    .find(
      (candidate) => new URL(candidate.url()).pathname === options.pathname,
    );
  if (found === undefined) {
    throw new Error(`The parent page has no frame "${options.pathname}"`);
  }
  return found;
}

async function openParentPage(options: {
  browser: Browser;
  parentUrl: string;
  output: { widthPixels: number; heightPixels: number };
  replies: Reply[];
}): Promise<Page> {
  const context = await options.browser.newContext({
    viewport: {
      width: options.output.widthPixels,
      height: options.output.heightPixels,
    },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.exposeFunction("deliverReply", (data: unknown) => {
    options.replies.push(replyOf(data));
  });
  await page.goto(options.parentUrl);
  return page;
}

export async function openPreviewInParent(options: {
  pageUrl: string;
  output: { widthPixels: number; heightPixels: number };
  permittedOrigin?: string;
}): Promise<PreviewInParent> {
  const replies: Reply[] = [];
  const otherServer = await startParentServer(() => "<!doctype html><p>x</p>");
  const parentServer = await startParentServer((origin) =>
    parentPageHtml({
      previewUrl: `${options.pageUrl}&parentOrigin=${encodeURIComponent(options.permittedOrigin ?? origin)}`,
      output: options.output,
      otherFrameUrl: `${otherServer.origin}/other`,
    }),
  );
  const browser = valueOf(await launchBrowser());
  const page = await openParentPage({
    browser,
    parentUrl: `${parentServer.origin}/`,
    output: options.output,
    replies,
  });
  return {
    replies,
    send: (message) =>
      page.evaluate((sent) => {
        const preview = document.querySelector<HTMLIFrameElement>("#preview");
        preview?.contentWindow?.postMessage(sent, "*");
      }, message),
    sendFromOtherOrigin: (message) =>
      frameOf({ page, pathname: "/other" }).evaluate((sent) => {
        window.parent.frames[0]?.postMessage(sent, "*");
      }, message),
    waitForReply: async (matches) => {
      const deadline = Date.now() + replyWaitMilliseconds;
      while (Date.now() < deadline) {
        const found = replies.find(matches);
        if (found !== undefined) {
          return found;
        }
        await delay(20);
      }
      throw new Error(`No matching reply. Replies: ${JSON.stringify(replies)}`);
    },
    screenshot: () => page.screenshot({ type: "png", caret: "initial" }),
    previewFrame: () => frameOf({ page, pathname: "/preview.html" }),
    close: async () => {
      await browser.close();
      await parentServer.close();
      await otherServer.close();
    },
  };
}
