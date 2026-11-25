import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine();
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

function sideWidthOf(page: Page): Promise<number> {
  return page
    .locator("aside.side")
    .evaluate((side) => Math.round(side.getBoundingClientRect().width));
}

async function dragEdge(options: { page: Page; byPixels: number }) {
  const edge = options.page.getByRole("separator", {
    name: /Width of the chat/,
  });
  const box = await edge.boundingBox();
  if (box === null) throw new Error("The edge of the chat is not shown.");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await options.page.mouse.move(x, y);
  await options.page.mouse.down();
  await options.page.mouse.move(x + options.byPixels / 2, y);
  await options.page.mouse.move(x + options.byPixels, y);
  await options.page.mouse.up();
}

describe("the width of the chat", () => {
  it("follows a drag of its left edge between 320 and 720 pixels, stays after a reload, and resets on a double click", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await page.getByRole("separator", { name: /Width of the chat/ }).waitFor();
    expect(await sideWidthOf(page)).toBe(400);

    await dragEdge({ page, byPixels: -200 });
    expect(await sideWidthOf(page)).toBe(600);
    await dragEdge({ page, byPixels: -400 });
    expect(await sideWidthOf(page)).toBe(720);
    await page.reload();
    await page.getByRole("separator", { name: /Width of the chat/ }).waitFor();
    expect(await sideWidthOf(page)).toBe(720);
    await dragEdge({ page, byPixels: 900 });
    expect(await sideWidthOf(page)).toBe(320);

    await page.getByRole("separator", { name: /Width of the chat/ }).dblclick();
    expect(await sideWidthOf(page)).toBe(400);
    await editor.close();
  });
});
