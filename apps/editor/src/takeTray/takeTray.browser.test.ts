import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildChapterFilm, rowText } from "../testing/chapterFilm.js";
import { approveFirstChapter } from "../testing/chapterTakes.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine({ fakeAgent: true });
  await buildChapterFilm(engine);
  await approveFirstChapter(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

async function openTray() {
  const editor = await openEditor(runningEngine().url);
  await editor.page.setViewportSize({ width: 1440, height: 1600 });
  await editor.page.getByRole("switch", { name: "Detailed timeline" }).check();
  return editor;
}

function tile(options: { page: Page; assetId: string }) {
  return options.page.locator(`[data-tray="${options.assetId}"]`);
}

async function undoAndCheck(page: Page): Promise<void> {
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("ControlOrMeta+z");
  await expect.poll(() => rowText(runningEngine())).toBe("a b c d e f");
}

describe("the tray of approved pictures and clips", () => {
  it("shows each approved picture and clip of Takes", async () => {
    const { page, close } = await openTray();

    await expect
      .poll(() =>
        page
          .getByRole("list", { name: "Approved pictures and clips" })
          .locator("[data-tray]")
          .evaluateAll((tiles) =>
            tiles.map((each) => each.getAttribute("data-tray")),
          ),
      )
      .toEqual(["a-start", "b-start", "a-clip", "b-clip"]);
    await close();
  });

  it("puts an approved clip in a scene of its chapter by drop on the timeline, and Cmd+Z brings the old clip back", async () => {
    const { page, close } = await openTray();

    await tile({ page, assetId: "a-clip" }).dragTo(
      page.locator('[data-clip="video-b-clip"]'),
    );

    await expect
      .poll(() => rowText(runningEngine()))
      .toBe("a a-clip-2 c d e f");
    await undoAndCheck(page);
    await close();
  });

  it("puts an approved picture in a scene by drop on its card", async () => {
    const { page, close } = await openTray();

    await tile({ page, assetId: "b-start" }).dragTo(
      page.locator('[data-card="video-e-clip"]'),
    );

    await expect
      .poll(() => rowText(runningEngine()))
      .toBe("a b c d picture-b-start f");
    await undoAndCheck(page);
    await close();
  });

  it("puts an approved picture in the picked scene when the person presses it", async () => {
    const { page, close } = await openTray();
    await tile({ page, assetId: "a-start" }).click();
    await expect
      .poll(() => page.getByRole("alert").allInnerTexts())
      .toContain(
        "Pick a scene first, then press the picture or the clip again.",
      );
    await page.locator('[data-card="video-c-clip"]').click();

    await tile({ page, assetId: "a-start" }).press("Enter");

    await expect
      .poll(() => rowText(runningEngine()))
      .toBe("a b picture-a-start d e f");
    await undoAndCheck(page);
    await close();
  });

  it("refuses a clip dropped on a scene of another chapter, in plain words", async () => {
    const { page, close } = await openTray();

    await tile({ page, assetId: "a-clip" }).dragTo(
      page.locator('[data-clip="video-d-clip"]'),
    );

    await expect
      .poll(() => page.getByRole("alert").allInnerTexts())
      .toContain(
        'This clip belongs to chapter 1, "The harbor". Drop it on a scene of that chapter.',
      );
    expect(await rowText(runningEngine())).toBe("a b c d e f");
    await close();
  });
});
