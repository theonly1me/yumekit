import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildChapterFilm } from "../../testing/chapterFilm.js";
import { approveFirstChapter } from "../../testing/chapterTakes.js";
import { closeBrowser, openEditor } from "../../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine();
  await buildChapterFilm(engine);
  await approveFirstChapter(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

describe("the takes of a picked chapter in Edit by hand", () => {
  it("opens the newest take of the chapter, and says when a chapter has none", async () => {
    const { page, close } = await openEditor(runningEngine().url);
    const sheet = page.getByRole("dialog", { name: "Takes" });

    await page.locator('[data-chapter-block="harbor"]').click();
    await page.getByRole("button", { name: "Open its takes" }).click();
    expect(await sheet.locator(".slate").innerText()).toContain("2");
    expect(await sheet.locator(".slate-facts p").first().innerText()).toBe(
      "Chapter 1, The harbor. Clips and music.",
    );
    await sheet.getByRole("button", { name: "Close" }).click();
    await page.locator('[data-chapter-block="fog"]').click();
    await page.getByRole("button", { name: "Open its takes" }).click();

    await expect
      .poll(() => sheet.innerText())
      .toContain("This chapter has no takes yet.");
    await close();
  });
});
