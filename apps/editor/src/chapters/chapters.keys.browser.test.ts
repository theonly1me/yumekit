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

async function undoAll(options: { page: Page; steps: number }) {
  const { page } = options;
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  for (let step = 0; step < options.steps; step += 1) {
    await page.keyboard.press("ControlOrMeta+z");
  }
  await expect.poll(() => chaptersText(runningEngine())).toBe(firstChapters);
  await expect.poll(() => rowText(runningEngine())).toBe("a b c d e f");
}

describe("chapters with the keyboard in Edit by hand", () => {
  it("moves a picked chapter with Alt and the arrow keys", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await page.locator('[data-chapter-block="harbor"]').click();

    await page.keyboard.press("Alt+ArrowRight");

    await expect
      .poll(() => chaptersText(runningEngine()))
      .toBe("Into the fog: c d | The harbor: a b | The island: e f");
    expect(await rowText(runningEngine())).toBe("c d a b e f");
    await undoAll({ page, steps: 1 });
    await close();
  });

  it("takes a picked scene across the line with one press, and the next press moves it inside the chapter", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await page.locator('[data-card="video-b-clip"]').click();

    await page.keyboard.press("Alt+ArrowRight");
    await expect
      .poll(() => chaptersText(runningEngine()))
      .toBe("The harbor: a | Into the fog: b c d | The island: e f");
    expect(await rowText(runningEngine())).toBe("a b c d e f");
    await page.keyboard.press("Alt+ArrowRight");

    await expect.poll(() => rowText(runningEngine())).toBe("a c b d e f");
    await undoAll({ page, steps: 2 });
    await close();
  });

  it("moves the line between two chapters with the arrow keys", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    const line = page.getByRole("separator", {
      name: "Line between chapter 1 and chapter 2",
    });
    await line.focus();

    await page.keyboard.press("ArrowLeft");
    await expect
      .poll(() => chaptersText(runningEngine()))
      .toBe("The harbor: a | Into the fog: b c d | The island: e f");
    await page.keyboard.press("ArrowRight");

    await expect.poll(() => chaptersText(runningEngine())).toBe(firstChapters);
    await close();
  });

  it("renames a chapter, splits it at the picked scene, and joins it again", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    await page.locator('[data-card="video-d-clip"]').click();
    await page.locator('[data-chapter-block="fog"]').click();
    const actions = page.getByRole("group", { name: "Actions for chapter 2" });

    await actions.getByRole("button", { name: "Rename" }).click();
    await actions.getByLabel("Name of chapter 2").fill("The fog bank");
    await actions.getByRole("button", { name: "Save" }).click();
    await expect
      .poll(() => chaptersText(runningEngine()))
      .toBe("The harbor: a b | The fog bank: c d | The island: e f");
    await actions.getByRole("button", { name: /^Split at "/ }).click();
    await expect
      .poll(() => chaptersText(runningEngine()))
      .toMatch(
        /^The harbor: a b \| The fog bank: c \| From .+: d \| The island: e f$/,
      );
    await actions.getByRole("button", { name: "Join with chapter 3" }).click();

    await expect
      .poll(() => chaptersText(runningEngine()))
      .toBe("The harbor: a b | The fog bank: c d | The island: e f");
    await undoAll({ page, steps: 3 });
    await close();
  });
});
