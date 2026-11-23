import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import {
  buildKitSceneProject,
  storedPropsOf,
} from "../../testing/kitSceneProject.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";
import { openStepSheet } from "../../testing/stepViews.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

async function openPictures() {
  const editor = await openEditor(runningEngine().url);
  await openStepSheet({ page: editor.page, name: "Pictures" });
  return editor;
}

function pngSizeOf(bytes: Buffer): [number, number] {
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

beforeAll(async () => {
  engine = await runEngine({ withChromium: true });
  await buildKitSceneProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the Pictures view", () => {
  it("shows one card for each scene in the shape of the picked version", async () => {
    const { page, close } = await openPictures();
    const cardShapes = () =>
      page.locator(".picture-card .picture").evaluateAll((pictures) =>
        pictures.map((picture) => {
          const box = picture.getBoundingClientRect();
          return box.width > box.height ? "wide" : "tall";
        }),
      );

    await expect
      .poll(() =>
        page.locator(".picture-card > span:not(.picture)").allTextContents(),
      )
      .toEqual([
        "1. Opening title",
        "2. Points",
        "3. Chart",
        "4. Harbor",
        "5. Closing line",
        "6. Frame counter",
      ]);
    expect(await cardShapes()).toEqual(Array.from({ length: 6 }, () => "wide"));
    await page
      .getByRole("group", { name: "Which version to show" })
      .getByRole("button")
      .last()
      .click();
    await expect
      .poll(cardShapes)
      .toEqual(Array.from({ length: 6 }, () => "tall"));
    await close();
  });

  it("opens a card large at half size, and a change of a text field is a direct change of the scene", async () => {
    const { page, close } = await openPictures();

    await page
      .getByRole("dialog")
      .getByRole("button", { name: /1\. Opening title/ })
      .click();

    await expect
      .poll(
        () =>
          page
            .locator(".picture-large img")
            .evaluate((image) =>
              image instanceof HTMLImageElement
                ? [image.naturalWidth, image.naturalHeight]
                : [],
            ),
        { timeout: 60_000 },
      )
      .toEqual([160, 90]);
    await page
      .locator(".picture-detail")
      .getByLabel("Heading", { exact: true })
      .fill("A new heading");
    await expect
      .poll(() =>
        storedPropsOf({ engine: runningEngine(), sceneId: "opening" }),
      )
      .toEqual({ heading: "A new heading", subheading: "A small line" });
    await close();
  }, 120_000);

  it("saves the picture of the scene as a full size PNG file", async () => {
    const { page, close } = await openPictures();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /3\. Chart/ })
      .click();

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60_000 }),
      page.getByRole("button", { name: "Download the picture" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("chart.png");
    const file = await download.path();
    expect(pngSizeOf(await readFile(file))).toEqual([320, 180]);
    await close();
  }, 120_000);
});
