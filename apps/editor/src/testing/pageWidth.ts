import type { Browser, Page } from "playwright";

export const phoneSize = { width: 390, height: 844 };

export interface PageWidth {
  pageWidth: number;
  windowWidth: number;
  widerParts: string[];
}

export function pageWidthOf(page: Page): Promise<PageWidth> {
  return page.evaluate(() => {
    const windowWidth = document.documentElement.clientWidth;
    const isInside = (box: DOMRect) =>
      box.right <= windowWidth + 1 && box.left >= -1;
    const isClipped = (element: Element) => {
      for (
        let parent = element.parentElement;
        parent !== null && parent !== document.body;
        parent = parent.parentElement
      ) {
        if (
          getComputedStyle(parent).overflowX !== "visible" &&
          isInside(parent.getBoundingClientRect())
        ) {
          return true;
        }
      }
      return false;
    };
    const widerParts = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        if (box.width === 0 || box.height === 0 || isInside(box)) return false;
        return !isClipped(element);
      })
      .map((element) => `${element.tagName} ${element.className}`);
    return {
      pageWidth: document.documentElement.scrollWidth,
      windowWidth,
      widerParts,
    };
  });
}

export const fitsTheWindow: PageWidth = {
  pageWidth: phoneSize.width,
  windowWidth: phoneSize.width,
  widerParts: [],
};

export async function openPhonePage(options: {
  browser: Browser;
  url: string;
}): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await options.browser.newContext({ viewport: phoneSize });
  context.setDefaultTimeout(15_000);
  const page = await context.newPage();
  await page.goto(options.url);
  return { page, close: () => context.close() };
}
