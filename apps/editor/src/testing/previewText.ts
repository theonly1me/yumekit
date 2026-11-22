import type { Locator, Page } from "playwright";

const clickAttempts = 8;

export async function startPreviewEdit(options: {
  page: Page;
  text: Locator;
}): Promise<void> {
  const editable = options.page
    .frameLocator('iframe[title="Preview of the video"]')
    .locator("[contenteditable]");
  for (let attempt = 0; attempt < clickAttempts; attempt += 1) {
    if ((await editable.count()) === 0) await options.text.click();
    const isEditing = await editable.waitFor({ timeout: 2_000 }).then(
      () => true,
      () => false,
    );
    if (isEditing) return;
  }
  throw new Error("The text in the preview did not become editable");
}
