import { chromium, type Browser, type Page } from "playwright";

export interface EditorPage {
  page: Page;
  previewFrame: () => Promise<number>;
  scrubberFrame: () => Promise<number>;
  close: () => Promise<void>;
}

let browser: Browser | undefined;

export async function sharedBrowser(): Promise<Browser> {
  browser ??= await chromium.launch();
  return browser;
}

export async function closeBrowser(): Promise<void> {
  await browser?.close();
  browser = undefined;
}

export async function openEditor(url: string): Promise<EditorPage> {
  const context = await (
    await sharedBrowser()
  ).newContext({ viewport: { width: 1440, height: 900 } });
  context.setDefaultTimeout(15_000);
  const page = await context.newPage();
  await page.goto(url);
  const shownFrame = page
    .frameLocator('iframe[title="Preview of the video"]')
    .locator("[data-output-frame]");
  return {
    page,
    previewFrame: async () =>
      Number(await shownFrame.getAttribute("data-output-frame")),
    scrubberFrame: async () =>
      Number(
        await page
          .getByRole("slider", { name: "Position in the video" })
          .inputValue(),
      ),
    close: () => context.close(),
  };
}

export async function openSceneTab(options: {
  page: Page;
  title: string;
}): Promise<void> {
  const { page, title } = options;
  await page.locator(".card", { hasText: title }).first().click();
  await page.getByRole("tab", { name: /^Scene/ }).click();
  await page.waitForFunction(
    (wanted) =>
      [...document.querySelectorAll(".scene-name")].some(
        (field) => field instanceof HTMLInputElement && field.value === wanted,
      ),
    title,
  );
}
