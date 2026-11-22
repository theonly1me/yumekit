import type { Locator, Page } from "playwright";

export async function startPreviewEdit(options: {
  page: Page;
  text: Locator;
}): Promise<void> {
  await options.text.click();
  await options.page
    .frameLocator('iframe[title="Preview of the video"]')
    .locator("[contenteditable]")
    .waitFor();
}
