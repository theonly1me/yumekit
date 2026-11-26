import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildChapterFilm, rowText } from "../testing/chapterFilm.js";
import { musicText } from "../testing/chapterTakes.js";
import { closeBrowser, openEditor } from "../testing/editorPage.js";
import { scenesRowClipsOf } from "../testing/projectFacts.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine();
  await buildChapterFilm(engine);
  await engine.callTool({
    name: "replace_music",
    input: { prompt: "Low strings" },
  });
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

async function lengths(): Promise<string> {
  const clips = await scenesRowClipsOf({
    engine: runningEngine(),
    outputId: "wide",
  });
  return clips.map((clip) => String(clip.durationFrames)).join(" ");
}

async function openTimeline() {
  const editor = await openEditor(runningEngine().url);
  await editor.page.getByRole("switch", { name: "Detailed timeline" }).check();
  return editor;
}

async function dragBy(options: {
  page: Page;
  handle: Locator;
  seconds: number;
}): Promise<void> {
  const { page } = options;
  await options.handle.scrollIntoViewIfNeeded();
  const lane = await page.locator(".scene-lane").boundingBox();
  const box = await options.handle.boundingBox();
  if (lane === null || box === null) throw new Error("Nothing to drag");
  const pixels = (lane.width / 12) * options.seconds;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + pixels / 2, y, { steps: 4 });
  await page.mouse.move(x + pixels, y, { steps: 4 });
  await page.mouse.up();
}

async function undo(page: Page): Promise<void> {
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("ControlOrMeta+z");
}

describe("the detailed timeline by drag", () => {
  it("shows the chapters above the scenes, and the approved items of Takes in a tray", async () => {
    const { page, close } = await openTimeline();
    const lane = page.locator(".chapter-lane");

    await expect
      .poll(() => lane.locator(".chapter-clip span").allInnerTexts())
      .toEqual(["1. The harbor", "2. Into the fog", "3. The island"]);
    expect(
      await page.getByRole("slider", { name: /^Line between chapter/ }).count(),
    ).toBe(2);
    expect(await page.locator(".tray .fact").innerText()).toContain(
      "Approved pictures and clips from Takes show here.",
    );
    await close();
  });

  it("makes a scene one second longer by dragging its right edge, and Cmd+Z undoes it", async () => {
    const { page, close } = await openTimeline();
    const edge = page.getByRole("slider", { name: "Length of scene 1" });

    await dragBy({ page, handle: edge, seconds: 1.2 });

    await expect.poll(lengths).toBe("90 60 60 60 60 60");
    expect(await rowText(runningEngine())).toBe("a b c d e f");
    await undo(page);
    await expect.poll(lengths).toBe("60 60 60 60 60 60");
    await expect.poll(() => edge.getAttribute("aria-valuenow")).toBe("2");
    await close();
  });

  it("changes the length of a scene with the arrow keys on its edge", async () => {
    const { page, close } = await openTimeline();
    await page.getByRole("slider", { name: "Length of scene 2" }).focus();

    await page.keyboard.press("ArrowRight");
    await expect.poll(lengths).toBe("60 90 60 60 60 60");
    await page.keyboard.press("ArrowLeft");

    await expect.poll(lengths).toBe("60 60 60 60 60 60");
    await close();
  });

  it("trims the music with the keys, moves it by drag and with Alt and the arrow keys, and Cmd+Z undoes the move", async () => {
    const { page, close } = await openTimeline();
    const music = page.getByRole("button", { name: /^Music: / });
    await page.getByRole("slider", { name: /^Length of the music/ }).focus();

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => musicText(runningEngine())).toBe("0+300");
    await dragBy({ page, handle: music, seconds: 1.1 });
    await expect.poll(() => musicText(runningEngine())).toBe("30+300");
    await music.focus();
    await page.keyboard.press("Alt+ArrowRight");
    await expect.poll(() => musicText(runningEngine())).toBe("60+300");
    await undo(page);

    await expect.poll(() => musicText(runningEngine())).toBe("30+300");
    await close();
  });

  it("moves a scene by dragging it onto another scene of the same chapter", async () => {
    const { page, close } = await openTimeline();

    await page
      .locator('[data-clip="video-b-clip"]')
      .dragTo(page.locator('[data-clip="video-a-clip"]'));

    await expect.poll(() => rowText(runningEngine())).toBe("b a c d e f");
    await undo(page);
    await expect.poll(() => rowText(runningEngine())).toBe("a b c d e f");
    await close();
  });
});
