import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildChapterFilm,
  chaptersText,
  firstChapters,
  rowText,
} from "../testing/chapterFilm.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine();
  await buildChapterFilm(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

function card(options: { page: Page; shotId: string }) {
  return options.page.locator(`[data-card="video-${options.shotId}-clip"]`);
}

async function undoAndCheck(page: Page): Promise<void> {
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("ControlOrMeta+z");
  await expect.poll(() => chaptersText(runningEngine())).toBe(firstChapters);
  await expect.poll(() => rowText(runningEngine())).toBe("a b c d e f");
}

describe("chapters by drag in Edit by hand", () => {
  it("shows the chapters above the scene cards, with the scenes of each chapter in its group", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    const blocks = page.getByRole("list", { name: "Chapters" });

    await expect
      .poll(() => blocks.locator(".chapter-name").allInnerTexts())
      .toEqual(["1. The harbor", "2. Into the fog", "3. The island"]);
    expect(
      await page.locator('[data-group="fog"] .card-title').allInnerTexts(),
    ).toEqual(["3. Shot c", "4. Shot d"]);
    expect(
      await page.getByRole("separator", { name: /^Line between/ }).count(),
    ).toBe(2);
    await close();
  });

  it("moves a scene into another chapter, before the scene it is dropped on, and Cmd+Z puts it back", async () => {
    const { page, close } = await openEditor(runningEngine().url);

    await card({ page, shotId: "a" }).dragTo(card({ page, shotId: "d" }));

    await expect
      .poll(() => chaptersText(runningEngine()))
      .toBe("The harbor: b | Into the fog: c a d | The island: e f");
    expect(await rowText(runningEngine())).toBe("b c a d e f");
    await expect
      .poll(() =>
        page.locator('[data-group="fog"] .card-title').allInnerTexts(),
      )
      .toEqual(["2. Shot c", "3. Shot a", "4. Shot d"]);
    await undoAndCheck(page);
    await close();
  });

  it("moves a chapter onto the place of another chapter, and its scenes follow", async () => {
    const { page, close } = await openEditor(runningEngine().url);

    await page
      .locator('[data-chapter-block="island"]')
      .dragTo(page.locator('[data-chapter-block="harbor"]'));

    await expect
      .poll(() => chaptersText(runningEngine()))
      .toBe("The island: e f | The harbor: a b | Into the fog: c d");
    expect(await rowText(runningEngine())).toBe("e f a b c d");
    await undoAndCheck(page);
    await close();
  });

  it("moves the line between two chapters onto a scene", async () => {
    const { page, close } = await openEditor(runningEngine().url);

    await page
      .getByRole("separator", { name: "Line between chapter 1 and chapter 2" })
      .dragTo(card({ page, shotId: "b" }));

    await expect
      .poll(() => chaptersText(runningEngine()))
      .toBe("The harbor: a | Into the fog: b c d | The island: e f");
    expect(await rowText(runningEngine())).toBe("a b c d e f");
    await undoAndCheck(page);
    await close();
  });

  it("puts a scene at the end of a chapter dropped on its block", async () => {
    const { page, close } = await openEditor(runningEngine().url);

    await card({ page, shotId: "f" }).dragTo(
      page.locator('[data-chapter-block="harbor"]'),
    );

    await expect
      .poll(() => chaptersText(runningEngine()))
      .toBe("The harbor: a b f | Into the fog: c d | The island: e");
    expect(await rowText(runningEngine())).toBe("a b f c d e");
    await undoAndCheck(page);
    await close();
  });
});
