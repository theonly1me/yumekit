import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, sharedBrowser } from "../testing/editorPage.js";
import { buildNamedProject } from "../testing/namedProject.js";
import {
  fitsTheWindow,
  openPhonePage,
  pageWidthOf,
  phoneSize,
} from "../testing/pageWidth.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true, withChromium: true });
  await buildNamedProject(engine);
}, 120_000);

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

async function openEditorOnPhone() {
  const opened = await openPhonePage({
    browser: await sharedBrowser(),
    url: runningEngine().url,
  });
  await opened.page.locator(".card", { hasText: "Harbor view" }).waitFor();
  return opened;
}

async function closeDialog(page: Page): Promise<void> {
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await page.getByRole("dialog").waitFor({ state: "detached" });
}

async function openFromMenu(options: { page: Page; name: string }) {
  await options.page.getByRole("button", { name: "Open", exact: true }).click();
  await options.page
    .getByRole("group", { name: "Open a view" })
    .getByRole("button", { name: options.name })
    .click();
  await options.page.getByRole("dialog").waitFor();
}

describe("the editor at the width of a phone", () => {
  it("keeps the editor, the chat, and each sheet inside 390 pixels", async () => {
    const { page, close } = await openEditorOnPhone();
    expect(await pageWidthOf(page)).toEqual(fitsTheWindow);

    await page.getByRole("button", { name: "Ask for a change" }).click();
    await expect
      .poll(() => page.getByRole("textbox").first().isVisible())
      .toBe(true);
    expect(await pageWidthOf(page)).toEqual(fitsTheWindow);
    await page
      .getByRole("complementary", { name: "Chat and the picked scene" })
      .getByRole("button", { name: "Close" })
      .click();

    for (const name of ["Script", "Pictures", "Cast", "Files"]) {
      await openFromMenu({ page, name });
      expect({ name, width: await pageWidthOf(page) }).toEqual({
        name,
        width: fitsTheWindow,
      });
      await closeDialog(page);
    }
    for (const name of ["Settings", "Export", "Open the voice"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await page.getByRole("dialog").waitFor();
      expect({ name, width: await pageWidthOf(page) }).toEqual({
        name,
        width: fitsTheWindow,
      });
      await closeDialog(page);
    }
    await close();
  });

  it("fits the window after a wide window becomes as narrow as a phone", async () => {
    const context = await (
      await sharedBrowser()
    ).newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(runningEngine().url);
    await page.locator(".card", { hasText: "Harbor view" }).waitFor();
    await page.waitForTimeout(500);

    await page.setViewportSize(phoneSize);

    await expect.poll(() => pageWidthOf(page)).toEqual(fitsTheWindow);
    await context.close();
  });

  it("keeps Make the clip in view while the person reads the clip sheet", async () => {
    const { page, close } = await openEditorOnPhone();
    await page.locator(".card", { hasText: "Morning walk" }).click();
    await page.getByRole("button", { name: "Make a real video clip" }).click();
    await page.getByRole("dialog").waitFor();
    expect(await pageWidthOf(page)).toEqual(fitsTheWindow);
    await page
      .getByText("The clip starts from this scene, as the video shows it now.")
      .waitFor();
    const make = page.getByRole("button", { name: "Make the clip" });
    await expect.poll(() => make.isEnabled()).toBe(true);
    const box = await make.boundingBox();
    expect(box === null ? undefined : box.y + box.height).toBeLessThanOrEqual(
      phoneSize.height,
    );
    await close();
  });
});
