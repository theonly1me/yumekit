import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject, lastFrame } from "./testing/counterProject.js";
import { closeBrowser, openEditor } from "./testing/editorPage.js";
import { runEngine, type RunningEngine } from "./testing/runEngine.js";

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

describe("the editor preview", () => {
  it("removes the token from the address bar after the first load", async () => {
    const editor = await openEditor(runningEngine().url);
    await expect
      .poll(() => editor.page.getByText("Editor test").count())
      .toBe(1);

    expect(editor.page.url()).toBe(`${runningEngine().origin}/`);
    await editor.close();
  });

  it("shows the frame of the progress line in the preview", async () => {
    const editor = await openEditor(runningEngine().url);
    const scrubber = editor.page.getByRole("slider", {
      name: "Position in the video",
    });

    await scrubber.fill("45");

    await expect.poll(editor.previewFrame).toBe(45);
    await scrubber.fill("12");
    await expect.poll(editor.previewFrame).toBe(12);
    await editor.close();
  });

  it("plays from the frame of the progress line, moves the frame, and stops at the last frame", async () => {
    const editor = await openEditor(runningEngine().url);
    await editor.page
      .getByRole("slider", { name: "Position in the video" })
      .fill("20");
    await expect.poll(editor.previewFrame).toBe(20);

    await editor.page.getByRole("button", { name: "Play" }).click();

    await expect.poll(editor.previewFrame).toBeGreaterThan(20);
    await expect
      .poll(() => editor.page.getByRole("button", { name: "Play" }).count())
      .toBe(1);
    expect(await editor.scrubberFrame()).toBe(lastFrame);
    await expect.poll(editor.previewFrame).toBe(lastFrame);
    await editor.close();
  });

  it("changes the shape of the preview when another platform tab is picked", async () => {
    const editor = await openEditor(runningEngine().url);
    const preview = editor.page.locator(".frame");
    await expect.poll(() => preview.getAttribute("data-output")).toBe("wide");
    const wide = await preview.boundingBox();

    await editor.page.getByRole("tab", { name: /^Tall/ }).click();

    await expect.poll(() => preview.getAttribute("data-output")).toBe("tall");
    const tall = await preview.boundingBox();
    expect((wide?.width ?? 0) / (wide?.height ?? 1)).toBeCloseTo(16 / 9, 1);
    expect((tall?.width ?? 0) / (tall?.height ?? 1)).toBeCloseTo(9 / 16, 1);
    await expect
      .poll(() =>
        editor.page
          .locator('iframe[title="Preview of the video"]')
          .getAttribute("src"),
      )
      .toContain("output=tall");
    await expect.poll(editor.previewFrame).toBe(0);
    await editor.close();
  });

  it("adds a tab for a platform from the list, and its preview takes its shape", async () => {
    const editor = await openEditor(runningEngine().url);
    const { page } = editor;
    await page.getByRole("button", { name: "Add a platform" }).click();

    await page
      .getByRole("group", { name: "Add a platform" })
      .getByRole("button", { name: /^Square/ })
      .click();

    const tab = page.getByRole("tab", { name: "Square 1:1" });
    await expect.poll(() => tab.getAttribute("aria-selected")).toBe("true");
    const preview = page.locator(".frame");
    await expect.poll(() => preview.getAttribute("data-output")).toBe("square");
    const box = await preview.boundingBox();
    expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(1, 1);
    await page.getByRole("button", { name: "Add a platform" }).click();
    await page.getByRole("button", { name: "Remove Square" }).click();
    await expect.poll(() => tab.count()).toBe(0);
    await editor.close();
  });
});
